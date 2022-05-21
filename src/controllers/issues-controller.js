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
export class IssuesController {
  async test (req, res, next) {
    try {
      console.log('TEST!')
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
  async index (req, res, next) {
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

  /**
   * Displays a form for editing an Issue.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async edit (req, res, next) {
    try {
      // Handlebars variables setup - retrieves Issue data from GitLab.
      const url = process.env.GITLAB_API_PROJECT_ISSUES_URL + '/' + req.params.issueid
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ACCESS_TOKEN
        }
      })
      // If Issue doesn't exist, throw error.
      if (response.status !== 200) {
        const error = new Error('404 Not Found')
        error.statusCode = 404
        throw error
      }
      const responseJSON = await response.json()
      // Parse response data to an Issue object
      const issue = {
        title: responseJSON.title,
        description: responseJSON.description,
        issueid: responseJSON.iid,
        userAvatar: responseJSON.author.avatar_url,
        userUsername: responseJSON.author.username,
        userFullname: responseJSON.author.name
      }
      if (responseJSON.closed_at !== null) issue.done = true
      else issue.done = false
      // Render form based on Issue data.
      res.render('real-time-issues/issues-edit', { issue })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Sends a PUT request to the GitLab API to update the Issue based on the
   * Edit form data.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async update (req, res, next) {
    try {
      const url = process.env.GITLAB_API_PROJECT_ISSUES_URL + '/' + req.params.issueid + '?title=' + req.body.title + '&description=' + req.body.description
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + process.env.ACCESS_TOKEN
        }
      })
      // If Issue doesn't exist, throw error.
      if (response.status !== 200) {
        const error = new Error('404 Not Found')
        error.statusCode = 404
        throw error
      }
      // Redirect and show a flash message.
      req.session.flash = { type: 'success', text: 'Issue #' + req.params.issueid + ' was updated.' }
      res.redirect('../')
    } catch (error) {
      next(error)
    }
  }

  /**
   * Sends a PUT request to the GitLab API to close an open Issue.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async close (req, res, next) {
    try {
      const url = process.env.GITLAB_API_PROJECT_ISSUES_URL + '/' + req.params.issueid + '?state_event=close'
      const response = fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + process.env.ACCESS_TOKEN
        }
      })
      // If Issue doesn't exist, throw error.
      if (response.status !== 200) {
        const error = new Error('404 Not Found')
        error.statusCode = 404
        throw error
      }
    } catch (error) {
      next(error)
    }

    // Skip redirect and flash.
    res.status(200).send()
  }

  /**
   * Sends a PUT request to the GitLab API to re-open a closed Issue.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async reopen (req, res, next) {
    try {
      const url = process.env.GITLAB_API_PROJECT_ISSUES_URL + '/' + req.params.issueid + '?state_event=reopen'
      const response = fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + process.env.ACCESS_TOKEN
        }
      })
      // If Issue doesn't exist, throw error.
      if (response.status !== 200) {
        const error = new Error('404 Not Found')
        error.statusCode = 404
        throw error
      }
    } catch (error) {
      next(error)
    }

    // Skip redirect and flash.
    res.status(200).send()
  }
}
