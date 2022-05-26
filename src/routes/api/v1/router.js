/**
 * Routes specific to the DHT11 Weather API v1.
 *
 * @author Erik Lindholm <elimk06@student.lnu.se>
 * @author Mats Loock
 * @version 1.0.0
 */

import express from 'express'
import { APIController } from '../../../controllers/api-controller.js'

export const router = express.Router()

const controller = new APIController()

// Map HTTP verbs and route paths to controller actions.
router.get('/', controller.index)
router.get('/currentReadings', controller.currentReadings)
router.get('/lastTenReadings', controller.lastReadings)
router.get('/dailyAverageReadings', controller.dailyAverageReadings)
