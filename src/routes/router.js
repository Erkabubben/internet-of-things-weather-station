/**
 * The routes.
 *
 * @author Erik Lindholm <elimk06@student.lnu.se>
 * @author Mats Loock
 * @version 1.0.0
 */

import express from 'express'
import createError from 'http-errors'
import { router as issuesRouter } from './issues-router.js'
import { router as hookRouter } from './hook-router.js'

export const router = express.Router()

router.use('/', issuesRouter)

// Webhook: Create a route for the hook
router.use('/webhook', hookRouter)

// Catch 404 (ALWAYS keep this as the last route).
router.use('*', (req, res, next) => next(createError(404)))
