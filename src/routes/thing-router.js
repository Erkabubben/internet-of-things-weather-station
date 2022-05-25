/**
 * Routes for the Real Time Issues application.
 *
 * @author Erik Lindholm <elimk06@student.lnu.se>
 * @author Mats Loock
 * @version 1.0.0
 */

import express from 'express'
import { ThingController } from '../controllers/thing-controller.js'

export const router = express.Router()

const controller = new ThingController()

// Map HTTP verbs and route paths to controller actions.
router.get('/', controller.index)
