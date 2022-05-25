/**
 * Module for the IssuesController.
 *
 * @author Erik Lindholm <elimk06@student.lnu.se>
 * @author Mats Loock
 * @version 1.0.0
 */

import fetch from 'node-fetch'
import influx from 'influx'

/**
 * Encapsulates a controller.
 */
export class SocketController {
  constructor (client, io) {
    this.client = client
    this.io = io
  }

  async init() {
    setInterval(async () => {
      const url = 'http://192.168.0.107/readings'
      const response = await fetch(url, {
        method: 'GET'
      })
      if (response.status === 200) {
        const responseText = await response.text()
        const responseTextSplit = responseText.split(';')
        console.log(responseText)
  
        await this.client.writePoints([
          {
            measurement: 'readings',
            tags: {},
            fields: { temperature: responseTextSplit[0], humidity: responseTextSplit[1] }
          }
        ])
        await this.updateLastReadings()
      }
    }, 10000 )

    console.log(await this.client.getMeasurements())
    await this.updateLastReadings()
  }

  async updateLastReadings () {
    const results = await this.client.query(`
      select * from readings
      order by time desc
      limit 10
    `)

    console.log(Date.now())

    console.log(results)

    results.reverse()

    const lastReadings = {}

    lastReadings.temperature = []
    lastReadings.humidity = []
    lastReadings.timestamps = []

    let lastValidReading = {}

    results.forEach(reading => {
      let formattedTime = reading.time.getHours() + ':' + reading.time.getMinutes() + ':' + reading.time.getSeconds()
      if (reading.temperature !== '--' && reading.humidity !== '--') {
        lastValidReading.temperature = reading.temperature
        lastValidReading.humidity = reading.humidity
        lastReadings.timestamps.push(formattedTime)
        lastReadings.temperature.push(reading.temperature)
        lastReadings.humidity.push(reading.humidity)
      } else {
        lastReadings.timestamps.push(formattedTime + (' (no reading)'))
        lastReadings.temperature.push(lastValidReading.temperature)
        lastReadings.humidity.push(lastValidReading.humidity)
      }
    })

    // Socket.io: Send the updated issue to all subscribers.
    this.io.emit('update', {
      temperature: 0,
      humidity: 0,
      lastReadings: lastReadings
    })
  } 
}
