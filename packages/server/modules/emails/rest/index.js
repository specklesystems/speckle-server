const { EmailVerificationFinalizationError } = require('@/modules/emails/errors')
const {
  finalizeEmailVerification
} = require('@/modules/emails/services/verification/finalize')

module.exports = (app) => {
  app.get('/auth/verifyemail', async (req, res) => {
    try {
      await finalizeEmailVerification(req.query.t)
      return res.redirect('/?emailverifiedstatus=true')
    } catch (error) {
      const msg =
        error instanceof EmailVerificationFinalizationError
          ? error.message
          : 'Email verification unexpectedly failed'
      req.log.info({ err: error }, 'Email verification failed.')
      return res.redirect(`/?emailverifiederror=${msg}`)
    }
  })
}
