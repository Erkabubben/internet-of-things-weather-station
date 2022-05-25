/**
 * Module for the IssuesController.
 *
 * @author Erik Lindholm <elimk06@student.lnu.se>
 * @author Mats Loock
 * @version 1.0.0
 */

import fetch from 'node-fetch'

/**
 * Encapsulates a controller.
 */
export class ThingController {
  /**
   * Retrieves the Issues list from GitLab and displays the index page.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async index (req, res, next) {
    function convertArrayToString (array, contentAreStrings) {
      let s = '['
      for (let i = 0; i < array.length; i++) {
        const element = array[i];
        s += contentAreStrings ? "'" + element + "'" : element
        if (i !== array.length - 1) {
          s += ', '
        }
      }
      s += ']'
      return s
    }

    try {
      const lastReadings = await res.socketController.getLastReadings()
      const meanReadings = await res.socketController.getMeanReadings()
      // Render the index page.
      res.render('real-time-issues/index', {
        lastReadingsTimestamp: convertArrayToString(lastReadings.timestamps, true),
        lastReadingsTemperature: convertArrayToString(lastReadings.temperature),
        lastReadingsHumidity: convertArrayToString(lastReadings.humidity)
      })
      await res.socketController.updateReadings()
    } catch (error) {
      next(error)
    }
  }

  /**
   * Retrieves the Issues list from GitLab and displays the index page.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
     async oldindex (req, res, next) {
      try {
        // Retrieve Issues list from GitLab by API call
        const url = process.env.GITLAB_API_PROJECT_ISSUES_URL
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + process.env.ACCESS_TOKEN
          }
        })
        const responseJSON = await response.json()
        // Parse response data to an array of Issue objects
        const issues = []
        responseJSON.forEach(element => {
          const issue = {
            title: element.title,
            description: element.description,
            issueid: element.iid,
            userAvatar: element.author.avatar_url,
            userUsername: element.author.username,
            userFullname: element.author.name
          }
          if (element.closed_at !== null) issue.done = true
          else issue.done = false
          issues.push(issue)
        })
        // Render the index page based on the Issues data
        res.render('real-time-issues/index', { issues })
      } catch (error) {
        next(error)
      }
    }

  /**
   * Determines whether the incoming Issue event Webhook is caused by
   * a whole new Issue being created, or an existing Issue being updated.
   * Then, sends a Socket.io event to all subscribers.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  async determineWebhookType (req, res) {
    if (req.body.changes.created_at !== undefined) { // CREATE ISSUE
      // Socket.io: Send the created issue to all subscribers.
      res.io.emit('new-issue', {
        title: req.body.title,
        description: req.body.description,
        issueid: req.body.issueid,
        done: req.body.done,
        userAvatar: req.body.userAvatar,
        userUsername: req.body.userUsername,
        userFullname: req.body.userFullname
      })
    } else { // UPDATE ISSUE
      // Socket.io: Send the updated issue to all subscribers.
      res.io.emit('update-issue', {
        title: req.body.title,
        description: req.body.description,
        issueid: req.body.issueid,
        done: req.body.done,
        userAvatar: req.body.userAvatar,
        userUsername: req.body.userUsername,
        userFullname: req.body.userFullname
      })
    }

    // Webhook: Call is from hook. Respond to hook, skip redirect and flash.
    if (req.headers['x-gitlab-event']) {
      res.status(200).send('Hook accepted')
    }
  }
}
