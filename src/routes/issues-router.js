/**
 * Routes for the Real Time Issues application.
 *
 * @author Erik Lindholm <elimk06@student.lnu.se>
 * @author Mats Loock
 * @version 1.0.0
 */

import express from 'express'
import { IssuesController } from '../controllers/issues-controller.js'

export const router = express.Router()

const controller = new IssuesController()

// Map HTTP verbs and route paths to controller actions.
router.get('/', controller.index)
router.get('/:issueid/edit', controller.edit)
router.post('/:issueid/close', controller.close)
router.post('/:issueid/reopen', controller.reopen)
router.post('/:issueid/update', controller.update)

router.get('/test', controller.test)
