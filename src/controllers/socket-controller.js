/**
 * Module for the SocketController.
 *
 * @author Erik Lindholm <elimk06@student.lnu.se>
 * @author Mats Loock
 * @version 1.0.0
 */

/**
 * Encapsulates a controller.
 */
export class SocketController {
  /**
   * Constructor for the SocketController.
   *
   * @param {object} client - The currently active InfluxDB client.
   * @param {object} io - The currently active Socket.io instance.
   */
  constructor (client, io) {
    this.client = client
    this.io = io
  }

  /**
   * Retrieves the last 10 readings from InfluxDB and returns their contents as an object with arrays.
   *
   * @param {boolean} displayFullTimeStamp - Determines the format of the returned timestamps.
   * @returns {object} - An object with arrays of timestamps as well as temperature and humidity values.
   */
  async getLastReadings (displayFullTimeStamp = false) {
    const lastReadings = {}

    lastReadings.temperature = []
    lastReadings.humidity = []
    lastReadings.timestamps = []

    const lastValidReading = {}

    const results = await this.client.query(`
      select * from readings
      order by time desc
      limit 10
    `)

    results.reverse()

    results.forEach(reading => {
      try {
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
      } catch (error) {
        console.log(error)
      }
    })

    return lastReadings
  }

  /**
   * Retrieves mean temperature and humidity readings of the last 30 days from InfluxDB and
   * returns them as an object with arrays.
   *
   * @param {boolean} displayFullTimeStamp - Determines the format of the returned timestamps.
   * @returns {object} - An object with arrays of timestamps as well as temperature and humidity values.
   */
  async getMeanReadings (displayFullTimeStamp = false) {
    const meanReadings = {}
    meanReadings.temperature = []
    meanReadings.humidity = []
    meanReadings.timestamps = []

    for (let i = 0; i < 30; i++) {
      try {
        const selectedDay = new Date()
        selectedDay.setDate(selectedDay.getDate() - i)
        const dateStr = selectedDay.getFullYear() + '-' + (selectedDay.getMonth() + 1).toString().padStart(2, '0') + '-' + selectedDay.getDate().toString().padStart(2, '0')
        const results = await this.client.query(`
          select MEAN("temperature"), MEAN("humidity") from readings
          WHERE time >= '${dateStr}T00:00:00Z' AND time <= '${dateStr}T23:59:59Z'
        `)

        if (results.length > 0) {
          meanReadings.timestamps.push(displayFullTimeStamp
            ? selectedDay
            : (selectedDay.getMonth() + 1).toString().padStart(2, '0') + '-' + selectedDay.getDate().toString().padStart(2, '0')
          )
          meanReadings.temperature.push(results[0].mean)
          meanReadings.humidity.push(results[0].mean_1)
        }
      } catch (error) {
        console.log(error)
      }
    }

    meanReadings.timestamps.reverse()
    meanReadings.temperature.reverse()
    meanReadings.humidity.reverse()

    return meanReadings
  }

  /**
   * Retrieves the last readings and daily mean readings from InfluxDB and sends an update to all
   * subscribing clients through Socket.io.
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
