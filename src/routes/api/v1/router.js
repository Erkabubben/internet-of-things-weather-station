/**
 * Routes specific to the DHT11 Weather API v1.
 *
 * @author Erik Lindholm <elimk06@student.lnu.se>
 * @author Mats Loock
 * @version 1.0.0
 */

import express from 'express'

export const router = express.Router()

function getLinks (req) {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl
    return {
        currentReadings: fullUrl + '/currentReadings',
        lastTenReadings: fullUrl + '/lastTenReadings',
        dailyAverageReadings: fullUrl + '/dailyAverageReadings'
    }
}

// Map HTTP verbs and route paths to controller actions.
router.get('/', (req, res) => {
    
    res.json({
        message: 'Welcome to the DHT11 Weather API! Please use one of the links below to retrieve the sensor data.',
        links: getLinks(req)
})})

router.get('/currentReadings', (req, res) => {
    res.json({
        temperature: 'Welcome to the DHT11 Weather API! Please use one of the links below to retrieve the sensor data.',
        links: getLinks(req)
})})

// router.use('/images', imagesRouter)
