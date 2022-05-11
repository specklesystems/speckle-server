'use strict'
const crs = require('crypto-random-string')
const knex = require('@/db/knex')

const { getUserByEmail, updateUserPassword } = require('@/modules/core/services/users')
const { getServerInfo } = require('@/modules/core/services/generic')
const { sendEmail } = require('@/modules/emails')

const ResetTokens = () => knex('pwdreset_tokens')
const RefreshTokens = () => knex('refresh_tokens')
const AuthorizationCodes = () => knex('authorization_codes')

module.exports = (app) => {
  // sends a password recovery email.
  app.post('/auth/pwdreset/request', async (req, res) => {
    try {
      if (!req.body.email) throw new Error('Invalid request')

      const user = await getUserByEmail({ email: req.body.email })
      if (!user) throw new Error('No user with that email found.')

      // check if pwd request has been already sent
      const existingToken = await ResetTokens()
        .select('*')
        .where({ email: req.body.email })
        .first()
      if (existingToken) {
        const timeDiff = Math.abs(Date.now() - new Date(existingToken.createdAt))
        if (timeDiff / 36e5 < 1)
          throw new Error(
            'Password reset already requested. Please try again in 1h, or check your email for the instructions we have sent.'
          )
      }

      // delete any previous pwd requests
      await ResetTokens().where({ email: req.body.email }).del()

      // create a new token
      const token = {
        id: crs({ length: 10 }),
        email: req.body.email
      }

      await ResetTokens().insert(token)

      const serverInfo = await getServerInfo()

      // send the reset link email

      const resetLink = new URL(
        `/authn/resetpassword/finalize?t=${token.id}`,
        process.env.CANONICAL_URL
      )
      const emailText = `
Hi ${user.name},

You've requested a password reset for your Speckle account at ${process.env.CANONICAL_URL}. If this wasn't you, ignore this email; otherwise, follow the link below to reset your password:

${resetLink}

The link above is valid for one hour only. If you continue to have problems, please get in touch!

Warm regards,
Speckle
      `

      const emailHtml = `
Hi ${user.name},
<br>
<br>
You've requested a password reset for your Speckle account. If this wasn't you, you can safely ignore this email. Otherwise, click <b><a href="${resetLink}" rel="notrack">here to reset your password</a></b>.
The link is <b>valid for one hour</b> only.
<br>
<br>
If you continue to have problems, please get in touch!
<br>
<br>
Warm regards,
<br>
Speckle
<br>
<br>
<img src="https://speckle.systems/content/images/2021/02/logo_big-1.png" style="width:30px; height:30px;">
<br>
<br>
<caption style="size:8px; color:#7F7F7F; width:400px; text-align: left;">
This email was sent from ${serverInfo.name} at ${
        process.env.CANONICAL_URL
      }, deployed and managed by ${serverInfo.company}. Your admin contact is ${
        serverInfo.adminContact ? serverInfo.adminContact : '[not provided]'
      }.
</caption>
`

      await sendEmail({
        to: user.email,
        subject: 'Speckle Account Password Reset',
        text: emailText,
        html: emailHtml
      })
      return res.status(200).send('Password reset email sent.')
    } catch (e) {
      res.status(400).send(e.message)
    }
  })

  // Finalizes password recovery.
  app.post('/auth/pwdreset/finalize', async (req, res) => {
    try {
      if (!req.body.tokenId || !req.body.password) throw new Error('Invalid request.')

      const token = await ResetTokens()
        .where({ id: req.body.tokenId })
        .select('*')
        .first()
      if (!token) throw new Error('Invalid request.')

      const timeDiff = Math.abs(Date.now() - new Date(token.createdAt))
      if (timeDiff / 36e5 > 1) {
        throw new Error('Link expired.')
      }

      const user = await getUserByEmail({ email: token.email })

      await updateUserPassword({ id: user.id, newPassword: req.body.password })

      await ResetTokens().where({ id: req.body.tokenId }).del()

      // Delete existing auth tokens
      await RefreshTokens().where({ userId: user.id }).del()
      await AuthorizationCodes().where({ userId: user.id }).del()
      await knex.raw(
        `
        DELETE FROM api_tokens
        WHERE owner = ?
        AND id NOT IN (
          SELECT p."tokenId" FROM personal_api_tokens p WHERE p."userId" = ?
        )
        `,
        [user.id, user.id]
      )

      return res.status(200).send('Password reset. Please log in.')
    } catch (e) {
      res.status(400).send(e.message)
    }
  })
}
