/**
 * Module for the SocketController.
 *
 * @author Erik Lindholm <elimk06@student.lnu.se>
 * @author Mats Loock
 * @version 1.0.0
 */

import fetch from 'node-fetch'

/**
 * Encapsulates a controller.
 */
export class SocketController {
  /**
   * @param client
   * @param io
   */
  constructor (client, io) {
    this.client = client
    this.io = io
  }

  /**
   *
   */
  async init () {
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
    }, 10000)
  }

  /**
   *
   */
  async getLastReadings (displayFullTimeStamp = false) {
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

    const lastValidReading = {}

    results.forEach(reading => {
      const formattedTime = reading.time.getHours().toString().padStart(2, '0') +
        ':' + reading.time.getMinutes().toString().padStart(2, '0') +
        ':' + reading.time.getSeconds().toString().padStart(2, '0')
      if (reading.temperature !== '--' && reading.humidity !== '--') {
        lastValidReading.temperature = reading.temperature
        lastValidReading.humidity = reading.humidity
        lastReadings.timestamps.push(displayFullTimeStamp ? reading.time : formattedTime)
        lastReadings.temperature.push(reading.temperature)
        lastReadings.humidity.push(reading.humidity)
      } else {
        lastReadings.timestamps.push((displayFullTimeStamp ? reading.time : formattedTime) + (' (no reading)'))
        lastReadings.temperature.push(lastValidReading.temperature)
        lastReadings.humidity.push(lastValidReading.humidity)
      }
    })

    return lastReadings
  }

  /**
   *
   */
  async getMeanReadings (displayFullTimeStamp = false) {
    const meanReadings = {}
    meanReadings.temperature = []
    meanReadings.humidity = []
    meanReadings.timestamps = []

    for (let i = 0; i < 30; i++) {
      const selectedDay = new Date()
      selectedDay.setDate(selectedDay.getDate() - i)
      const dateStr = selectedDay.getFullYear() + '-' + (selectedDay.getMonth() + 1).toString().padStart(2, '0') + '-' + selectedDay.getDate().toString().padStart(2, '0')
      const results = await this.client.query(`
        select MEAN("temperature"), MEAN("humidity") from readings
        WHERE time >= '${dateStr}T00:00:00Z' AND time <= '${dateStr}T23:59:59Z'
        order by time desc
      `)

      if (results.length > 0) {
        meanReadings.timestamps.push(displayFullTimeStamp
          ? selectedDay
          : (selectedDay.getMonth() + 1).toString().padStart(2, '0') + '-' + selectedDay.getDate().toString().padStart(2, '0')
        )
        meanReadings.temperature.push(results[0].mean)
        meanReadings.humidity.push(results[0].mean_1)
      }
    }

    meanReadings.timestamps.reverse()
    meanReadings.temperature.reverse()
    meanReadings.humidity.reverse()

    return meanReadings
  }

  /**
   *
   */
  async updateReadings () {
    const lastReadings = await this.getLastReadings()
    const meanReadings = await this.getMeanReadings()
    // Socket.io: Send the update to all subscribers.
    this.io.emit('update', {
      temperature: lastReadings.temperature[lastReadings.temperature.length - 1],
      humidity: lastReadings.humidity[lastReadings.humidity.length - 1],
      lastReadings: lastReadings,
      meanReadings: meanReadings
    })
  }
}
