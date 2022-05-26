/**
 * The routes.
 *
 * @author Erik Lindholm <elimk06@student.lnu.se>
 * @author Mats Loock
 * @version 1.0.0
 */

import express from 'express'
import createError from 'http-errors'
import { router as dht11WeatherRouter } from './dht11-weather-router.js'
import { router as v1Router } from './api/v1/router.js'

export const router = express.Router()

router.use('/', dht11WeatherRouter)
router.use('/api/v1', v1Router)

// Catch 404 (ALWAYS keep this as the last route).
router.use('*', (req, res, next) => next(createError(404)))
