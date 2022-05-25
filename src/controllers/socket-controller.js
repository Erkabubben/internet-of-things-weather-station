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
  
        if (responseTextSplit[0] !== '--' && responseTextSplit[1] !== '--') {
          await this.client.writePoints([
            {
              measurement: 'readings',
              tags: {},
              fields: { temperature: responseTextSplit[0], humidity: responseTextSplit[1] }
            }
          ])
        }

        await this.updateReadings()
      }
    }, 10000 )
  }

  async getLastReadings () {
    const results = await this.client.query(`
      select * from readings
      order by time desc
      limit 10
    `)

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

    return lastReadings
  }

  async getMeanReadings () {
    const meanReadings = {}
    meanReadings.temperature = []
    meanReadings.humidity = []
    meanReadings.timestamps = []

    for (let i = 0; i < 31; i++) {
      let selectedDay = new Date()
      selectedDay.setDate(selectedDay.getDate() - i)
      const dateStr = selectedDay.getFullYear() + '-' + selectedDay.getMonth().toString().padStart(2, '0') + '-' + selectedDay.getDate().toString().padStart(2, '0')
      const results = await this.client.query(`
        select MEAN("temperature"), MEAN("humidity") from readings
        WHERE time >= '${dateStr}T00:00:00Z' AND time <= '${dateStr}T23:59:59Z'
        order by time desc
      `)

      if (results.length > 0) {
        meanReadings.timestamps.push(selectedDay.getMonth().toString().padStart(2, '0') + '-' + selectedDay.getDate().toString().padStart(2, '0'))
        meanReadings.temperature.push(results[0].mean)
        meanReadings.humidity.push(results[0].mean_1)
      }
    }

    meanReadings.timestamps.reverse()
    meanReadings.temperature.reverse()
    meanReadings.humidity.reverse()

    return meanReadings
  }

  async updateReadings () {
    const lastReadings = await this.getLastReadings()
    const meanReadings = await this.getMeanReadings()
    // Socket.io: Send the updated issue to all subscribers.
    this.io.emit('update', {
      temperature: lastReadings.temperature[lastReadings.temperature.length - 1],
      humidity: lastReadings.humidity[lastReadings.humidity.length - 1],
      lastReadings: lastReadings,
      meanReadings: meanReadings
    })
  } 
}
