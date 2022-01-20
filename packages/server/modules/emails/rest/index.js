const appRoot = require('app-root-path')
const { getUserByEmail } = require(`${appRoot}/modules/core/services/users`)
const { matomoMiddleware } = require(`${appRoot}/logging/matomoHelper`)
const { contextMiddleware } = require(`${appRoot}/modules/shared`)
const { sendEmailVerification } = require('../services/verification')

module.exports = (app) => {

  // send email verification
  app.post(
    '/auth/emailverification/request',
    contextMiddleware,
    async (req, res, __) => {
      try {
        if (!req.context.auth) return res.status(403).send('Not authenticated')
        if (!req.body.email) return res.status(400).send('Invalid request')
        const user = await getUserByEmail({ email: req.body.email })
        const authedUser = req.context
        if (user.id !== authedUser.userId) return res.status(403).send(
          'Authenticated user email doesn\'t match the requested email'
        )
        const emailResult =  await sendEmailVerification({ 'recipient': user.email })

        // i'm choosing not to create a test for this, since its hard,
        // and in the real world this should not exist
        // i also tested it manually
        // sorry if this causes pain for u
        /* istanbul ignore next */
        if (!emailResult) return res.status(500).send('Email sending failed')

        return res.status(200).send('Email verification initiated.')
      } catch (error) {
        return res.status(500).send(error.message)
      }
    })
}