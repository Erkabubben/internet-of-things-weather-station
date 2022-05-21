/**
 * Webhook routes.
 *
 * @author Erik Lindholm <elimk06@student.lnu.se>
 * @author Mats Loock
 * @version 1.0.0
 */

import express from 'express'
import { HookController } from '../controllers/hook-controller.js'
import { ThingController } from '../controllers/thing-controller.js'

export const router = express.Router()

const controller = new HookController()
const issuesController = new ThingController()

// Map HTTP verbs and route paths to controller actions.
router.post('/issue', controller.authorize, controller.index, issuesController.determineWebhookType)
