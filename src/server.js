/**
 * The starting point of the application.
 *
 * @author Mats Loock
 * @author Erik Lindholm <elimk06@student.lnu.se>
 * @version 1.0.0
 */

import express from 'express'
import hbs from 'express-hbs'
import session from 'express-session'
import helmet from 'helmet'
import logger from 'morgan'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { router } from './routes/router.js'

// Socket.io: To add Socket.io support
import http from 'http'
import { Server } from 'socket.io'

import { connectDB, client } from './config/influx.js'
import { SocketController } from './controllers/socket-controller.js'

/**
 * The main function of the application.
 */
const main = async () => {
  // Initiates the InfluxDB database.
  await connectDB()

  // Creates an Express application.
  const app = express()

  // Get the directory name of this module's path.
  const directoryFullName = dirname(fileURLToPath(import.meta.url))

  // Set up base tag
  const baseURL = process.env.BASE_URL || '/'

  // Set various HTTP headers to make the application little more secure (https://www.npmjs.com/package/helmet).
  // (The web application uses external scripts and therefore needs to explicitly trust on code.jquery.com and cdn.jsdelivr.net.)
  app.use(helmet())
  app.use(
    helmet.contentSecurityPolicy({
      directives: { // unsafe-eval added to allow Handlebars to work on client
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", "'unsafe-inline'", 'code.jquery.com', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', "'unsafe-eval'"], // Allows scripts to be loaded from the listed sites
        'img-src': ["'self'", 'secure.gravatar.com'] // Allows images to be loaded from the listed sites
      }
    })
  )

  // Set up a morgan logger using the dev format for log entries.
  app.use(logger('dev'))

  // View engine setup (Handlebars).
  app.engine('hbs', hbs.express4({
    defaultLayout: join(directoryFullName, 'views', 'layouts', 'default'),
    partialsDir: join(directoryFullName, 'views', 'partials')
  }))
  app.set('view engine', 'hbs')
  app.set('views', join(directoryFullName, 'views'))

  // Parse requests of the content type application/x-www-form-urlencoded.
  // Populates the request object with a body object (req.body).
  app.use(express.urlencoded({ extended: false }))

  // Webhook: Enable body parsing of application/json
  // Populates the request object with a body object (req.body).
  app.use(express.json())

  // Serve static files.
  app.use(express.static(join(directoryFullName, '..', 'public')))

  // Setup and use session middleware (https://github.com/expressjs/session).
  const sessionOptions = {
    name: process.env.SESSION_NAME, // Don't use default session cookie name.
    secret: process.env.SESSION_SECRET, // Change it!!! The secret is used to hash the session with HMAC.
    resave: false, // Resave even if a request is not changing the session.
    saveUninitialized: false, // Don't save a created but not modified session.
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      sameSite: 'lax'
    }
  }

  if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy
    sessionOptions.cookie.secure = true // serve secure cookies
  }

  app.use(session(sessionOptions))

  // Socket.io: Add socket.io to the Express project
  const server = http.createServer(app)
  const io = new Server(server)

  // Socket.io; Not necessary, but nice to log when users connect/disconnect
  io.on('connection', (socket) => {
    console.log('a user connected')

    socket.on('disconnect', () => {
      console.log('user disconnected')
    })
  })

  // Set up SocketController
  const socketController = new SocketController(client, io)
  await socketController.init()

  // Middleware to be executed before the routes.
  app.use((req, res, next) => {
    // Flash messages - survives only a round trip.
    if (req.session.flash) {
      res.locals.flash = req.session.flash
      delete req.session.flash
    }

    // Pass the base URL to the views.
    res.locals.baseURL = baseURL

    // Socket.io: Add Socket.io to the Response-object to make it available in controllers.
    res.io = io

    // SocketController: Add SocketController to the Response-object to make it available in controllers.
    res.socketController = socketController

    next()
  })

  // Register routes.
  app.use('/', router)

  // Error handler.
  app.use(function (err, req, res, next) {
    // 404 Not Found.
    if (err.status === 404) {
      return res
        .status(404)
        .sendFile(join(directoryFullName, 'views', 'errors', '404.html'))
    }

    // 500 Internal Server Error (in production, all other errors send this response).
    if (req.app.get('env') !== 'development') {
      return res
        .status(500)
        .sendFile(join(directoryFullName, 'views', 'errors', '500.html'))
    }

    // Development only!
    // Only providing detailed error in development.

    // Render the error page.
    const user = req.session.user // Adds a user object so that the header will still be displayed properly.
    res
      .status(err.status || 500)
      .render('errors/error', { error: err, user })
  })

  // Starts the HTTP server listening for connections.
  // Socket.io: Using server instead of express
  server.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${process.env.PORT}`)
    console.log('Press Ctrl-C to terminate...')
  })
}

main().catch(console.error)
