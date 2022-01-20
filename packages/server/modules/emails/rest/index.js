const appRoot = require('app-root-path')
const knex = require(`${appRoot}/db/knex`)

const { getUserByEmail } = require(`${appRoot}/modules/core/services/users`)
const { contextMiddleware } = require(`${appRoot}/modules/shared`)
const { sendEmailVerification } = require('../services/verification')

const Verifications = () => knex('email_verifications')
const Users = () => knex('users')

module.exports = (app) => {
  app.post(
    '/auth/emailverification/request',
    contextMiddleware,
    async (req, res, __) => {
      try {
        if (!req.context.auth) return res.status(403).send('Not authenticated')
        if (!req.body.email) return res.status(400).send('Invalid request')
        const user = await getUserByEmail({ 'email': req.body.email })
        if (user.id !== req.context.userId) {
          return res.status(403).send(
            'Authenticated user email doesn\'t match the requested email',
          )
        }
        const emailResult = await sendEmailVerification(
          { 'recipient': user.email },
        )

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
    },
  )

  app.get('/auth/verifyemail', async (req, res, __) => {
    if (!req.query.t) return res.status(400).send('No verification token set.')

    const verification = await Verifications()
      .where({ 'id': req.query.t })
      .first()

    if (!verification) {
      return res.status(404).send('No verification with this token.')
    }

    const timeDiff = Math.abs(Date.now() - new Date(verification.createdAt))
    if (timeDiff > 8.64e+7) {
      return res
        .status(400)
        .send('Verification expired, please request a new one.')
    }

    await Users()
      .where({ 'email': verification.email })
      .update({ 'verified': true })
    await Verifications().where({ 'id': req.query.t }).del()

    return res.redirect('/')
  })
}
