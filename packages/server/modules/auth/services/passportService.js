const passport = require('passport')
const debug = require('debug')

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
      if (err) debug('speckle:errors')(err)
      if (!user) {
        const errMsg = info?.message || 'Failed to authenticate, contact server admins'
        return res.redirect(`/error?message=${errMsg}`)
      }

      req.user = user
      return next()
    })(req, res, next)
}

module.exports = {
  passportAuthenticate
}
