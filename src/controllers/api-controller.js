/**
 * Module for the APIController.
 *
 * @author Erik Lindholm <elimk06@student.lnu.se>
 * @author Mats Loock
 * @version 1.0.0
 */

/**
 * Gets an object containing the list of links used to navigate the API.
 *
 * @param {object} req - Express request object.
 * @returns {object} - An object containing the list of links used to navigate the API.
 */
function getLinks (req) {
  const fullUrl = req.protocol + '://' + req.get('host') + '/api/v1'
  return {
    index: fullUrl,
    currentReadings: fullUrl + '/current-readings',
    lastTenReadings: fullUrl + '/last-ten-readings',
    dailyAverageReadings: fullUrl + '/daily-average-readings'
  }
}

/**
 * Encapsulates a controller.
 */
export class APIController {
  /**
   * Returns the API welcome message and links to available routes.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async index (req, res, next) {
    res.json({
      message: 'Welcome to the DHT11 Weather API! Please use one of the links to retrieve the sensor data.',
      links: getLinks(req)
    })
  }

  /**
   * Responds with the most current readings from the database.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async currentReadings (req, res, next) {
    const readings = await res.socketController.getLastReadings(true)
    res.json({
      data: {
        timestamp: readings.timestamps[readings.timestamps.length - 1],
        temperature: readings.temperature[readings.temperature.length - 1],
        humidity: readings.humidity[readings.humidity.length - 1]
      },
      links: getLinks(req)
    })
  }

  /**
   * Responds with the ten last readings from the database.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async lastReadings (req, res, next) {
    const readings = await res.socketController.getLastReadings(true)
    const data = []
    for (let i = 0; i < readings.timestamps.length; i++) {
      data.push({
        timestamp: readings.timestamps[i],
        temperature: readings.temperature[i],
        humidity: readings.humidity[i]
      })
    }
    res.json({
      data: data.reverse(),
      links: getLinks(req)
    })
  }

  /**
   * Responds with a list of daily average readings from the database.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async dailyAverageReadings (req, res, next) {
    const readings = await res.socketController.getMeanReadings(true)
    const data = []
    for (let i = 0; i < readings.timestamps.length; i++) {
      const formattedDate = readings.timestamps[i].getFullYear() +
        '-' + (readings.timestamps[i].getMonth() + 1).toString().padStart(2, '0') +
        '-' + readings.timestamps[i].getDate().toString().padStart(2, '0')
      data.push({
        timestamp: formattedDate,
        temperature: readings.temperature[i],
        humidity: readings.humidity[i]
      })
    }
    res.json({
      data: data.reverse(),
      links: getLinks(req)
    })
  }

  /**
   * Used by the ESP32 device to send sensor readings. Readings are added to the
   * database, and then Socket.io-connected clients are updated.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
     async messageFromSensor (req, res, next) {
      //console.log('Message from sensor arrived: ' + req.body.readings)
      try {
        const requestTextSplit = req.body.readings.split(';')
        // If the request returns a successful reading, add it to the InfluxDB database.
        if (requestTextSplit[0] !== '--' && requestTextSplit[1] !== '--') {
          await res.socketController.client.writePoints([
            {
              measurement: 'readings',
              tags: {},
              fields: { temperature: requestTextSplit[0], humidity: requestTextSplit[1] }
            }
          ])
        }
        // Then, update all clients connected through Socket.io.
        await res.socketController.updateReadings()
        res.status(200).send('Message accepted.')
      } catch (error) {
        console.log('ERROR: Problem with incoming message.')
      }
    }
}
