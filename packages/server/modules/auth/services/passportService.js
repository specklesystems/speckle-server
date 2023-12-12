const passport = require('passport')
const { logger } = require('@/logging/logging')
const {
  useNewFrontend,
  getFrontendOrigin
} = require('@/modules/shared/helpers/envHelper')
const {
  UnverifiedEmailSSOLoginError,
  UserInputError
} = require('@/modules/core/errors/userinput')

/**
 * Wrapper for passport.authenticate that handles success & failure scenarios correctly
 * (passport.authenticate() by default doesn't, so don't use it)
 * @param {import('passport').Strategy | string} strategy
 * @param {import('passport').AuthenticateOptions | undefined} [options]
 * @returns {import('express').Handler}
 */
function passportAuthenticate(strategy, options = undefined) {
  return (req, res, next) =>
    passport.authenticate(strategy, options, (err, user, info) => {
      if (err && !(err instanceof UserInputError)) logger.error(err)
      if (!user) {
        const errMsg = info?.message || 'Failed to authenticate, contact server admins'
        let errPath = `/error?message=${errMsg}`

        if (err instanceof UnverifiedEmailSSOLoginError) {
          const email = err.info()?.email || ''
          errPath = `/error-email-verify?email=${email}`
        }

        return useNewFrontend()
          ? res.redirect(new URL(errPath, getFrontendOrigin()).toString())
          : res.redirect(errPath)
      }

      req.user = user
      next()
    })(req, res, next)
}

module.exports = {
  passportAuthenticate
}
