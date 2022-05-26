/**
 * Module for the DHT11WeatherController.
 *
 * @author Erik Lindholm <elimk06@student.lnu.se>
 * @author Mats Loock
 * @version 1.0.0
 */

import hbs from 'express-hbs'

/**
 * Encapsulates a controller.
 */
export class DHT11WeatherController {
  /**
   * Retrieves the Issues list from GitLab and displays the index page.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async index (req, res, next) {
    /**
     * @param array
     * @param contentAreStrings
     */
    function convertArrayToString (array, contentAreStrings) {
      let s = '['
      for (let i = 0; i < array.length; i++) {
        const element = array[i]
        s += contentAreStrings ? `'${element}'` : element
        if (i !== array.length - 1) {
          s += ', '
        }
      }
      s += ']'
      return s
    }

    try {
      const lastReadings = await res.socketController.getLastReadings()
      const meanReadings = await res.socketController.getMeanReadings()
      // Render the index page.
      res.render('dht11-weather/index', {
        lastReadingsTimestamps: new hbs.SafeString(convertArrayToString(lastReadings.timestamps, true)),
        lastReadingsTemperature: convertArrayToString(lastReadings.temperature),
        lastReadingsHumidity: convertArrayToString(lastReadings.humidity),
        meanReadingsTimestamps: new hbs.SafeString(convertArrayToString(meanReadings.timestamps, true)),
        meanReadingsTemperature: convertArrayToString(meanReadings.temperature),
        meanReadingsHumidity: convertArrayToString(meanReadings.humidity),
        currentTemperature: lastReadings.temperature[lastReadings.temperature.length - 1],
        currentHumidity: lastReadings.humidity[lastReadings.humidity.length - 1]
      })
      await res.socketController.updateReadings()
    } catch (error) {
      next(error)
    }
  }
}
