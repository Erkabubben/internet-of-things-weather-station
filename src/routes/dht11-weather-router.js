/**
 * Routes for the DHT11 Weather application.
 *
 * @author Erik Lindholm <elimk06@student.lnu.se>
 * @author Mats Loock
 * @version 1.0.0
 */

import express from 'express'
import { DHT11WeatherController } from '../controllers/dht11-weather-controller.js'

export const router = express.Router()

const controller = new DHT11WeatherController()

// Map HTTP verbs and route paths to controller actions.
router.get('/', controller.index)
