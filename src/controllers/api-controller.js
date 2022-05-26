/**
 * Module for the APIController.
 *
 * @author Erik Lindholm <elimk06@student.lnu.se>
 * @author Mats Loock
 * @version 1.0.0
 */

function getLinks (req) {
  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl
  return {
      currentReadings: fullUrl + '/currentReadings',
      lastTenReadings: fullUrl + '/lastTenReadings',
      dailyAverageReadings: fullUrl + '/dailyAverageReadings'
  }
}

/**
 * Encapsulates a controller.
 */
export class APIController {
  /**
   * Retrieves the Issues list from GitLab and displays the index page.
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





}
