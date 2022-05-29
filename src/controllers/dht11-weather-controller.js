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
   * Displays the index page.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async index (req, res, next) {
    /**
     * Takes an array and returns it as an array string literal, ready to be
     * inserted into Handlebars.
     *
     * @param {Array} array - The array to turn into a string literal.
     * @param {boolean} contentAreStrings - Whether the array contents are strings or numbers.
     * @returns {string} - The provided array as a string literal.
     */
    function convertArrayToStringLiteral (array, contentAreStrings) {
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
      // Gets readings necessary for displaying current temperature and humidity as well as charts.
      const lastReadings = await res.socketController.getLastReadings()
      const meanReadings = await res.socketController.getMeanReadings()
      // Provide readings data and render the index page.
      res.render('dht11-weather/index', {
        lastReadingsTimestamps: new hbs.SafeString(convertArrayToStringLiteral(lastReadings.timestamps, true)),
        lastReadingsTemperature: convertArrayToStringLiteral(lastReadings.temperature),
        lastReadingsHumidity: convertArrayToStringLiteral(lastReadings.humidity),
        meanReadingsTimestamps: new hbs.SafeString(convertArrayToStringLiteral(meanReadings.timestamps, true)),
        meanReadingsTemperature: convertArrayToStringLiteral(meanReadings.temperature),
        meanReadingsHumidity: convertArrayToStringLiteral(meanReadings.humidity),
        currentTemperature: lastReadings.temperature[lastReadings.temperature.length - 1],
        currentHumidity: lastReadings.humidity[lastReadings.humidity.length - 1]
      })
    } catch (error) {
      next(error)
    }
  }
}
