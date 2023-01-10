'use strict'
const {
  createUser,
  validatePasssword,
  getUserByEmail
} = require('@/modules/core/services/users')
const { getServerInfo } = require('@/modules/core/services/generic')
const {
  sendRateLimitResponse,
  getRateLimitResult,
  isRateLimitBreached,
  RateLimitAction
} = require('@/modules/core/services/ratelimiter')
const {
  validateServerInvite,
  finalizeInvitedServerRegistration,
  resolveAuthRedirectPath
} = require('@/modules/serverinvites/services/inviteProcessingService')
const { getIpFromRequest } = require('@/modules/shared/utils/ip')
const { logger } = require('@/logging/logging')

module.exports = async (app, session, sessionAppId, finalizeAuth) => {
  const strategy = {
    id: 'local',
    name: 'Local',
    icon: 'TODO',
    color: 'accent',
    url: '/auth/local'
  }

  app.post(
    '/auth/local/login',
    session,
    sessionAppId,
    async (req, res, next) => {
      try {
        const valid = await validatePasssword({
          email: req.body.email,
          password: req.body.password
        })

        if (!valid) throw new Error('Invalid credentials')

        const user = await getUserByEmail({ email: req.body.email })
        if (!user) throw new Error('Invalid credentials')
        req.user = { id: user.id }

        return next()
      } catch (err) {
        return res.status(401).send({ err: true, message: 'Invalid credentials' })
      }
    },
    finalizeAuth
  )

  app.post(
    '/auth/local/register',
    session,
    sessionAppId,
    async (req, res, next) => {
      const serverInfo = await getServerInfo()
      try {
        if (!req.body.password) throw new Error('Password missing')

        const user = req.body
        const ip = getIpFromRequest(req)
        if (ip) user.ip = ip
        const source = ip ? ip : 'unknown'
        const rateLimitResult = await getRateLimitResult(
          RateLimitAction.USER_CREATE,
          source
        )
        if (isRateLimitBreached(rateLimitResult)) {
          return sendRateLimitResponse(res, rateLimitResult)
        }

        // 1. if the server is invite only you must have an invite
        if (serverInfo.inviteOnly && !req.session.token)
          throw new Error('This server is invite only. Please provide an invite id.')

        // 2. if you have an invite it must be valid, both for invite only and public servers
        /** @type {import('@/modules/serverinvites/helpers/types').ServerInviteRecord} */
        let invite
        if (req.session.token) {
          invite = await validateServerInvite(user.email, req.session.token)
        }

        // 3. at this point we know, that we have one of these cases:
        //    * the server is invite only and the user has a valid invite
        //    * the server public and the user has a valid invite
        //    * the server public and the user doesn't have an invite
        // so we go ahead and register the user
        const userId = await createUser(user)
        req.user = { id: userId, email: user.email }

        // 4. use up all server-only invites the email had attached to it
        await finalizeInvitedServerRegistration(user.email, userId)

        // Resolve redirect path
        req.authRedirectPath = resolveAuthRedirectPath(invite)

        return next()
      } catch (err) {
        logger.error(err)
        return res.status(400).send({ err: err.message })
      }
    },
    finalizeAuth
  )

  return strategy
}
