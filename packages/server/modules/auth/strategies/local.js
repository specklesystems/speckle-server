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
  isRateLimitBreached
} = require('@/modules/core/services/ratelimiter')
const {
  validateServerInviteFactory,
  finalizeInvitedServerRegistrationFactory,
  resolveAuthRedirectPathFactory
} = require('@/modules/serverinvites/services/inviteProcessingService')
const { getIpFromRequest } = require('@/modules/shared/utils/ip')
const { NoInviteFoundError } = require('@/modules/serverinvites/errors')
const {
  UserInputError,
  PasswordTooShortError
} = require('@/modules/core/errors/userinput')
const {
  findServerInviteFactory,
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} = require('@/modules/serverinvites/repositories/serverInvites')
const db = require('@/db/knex')

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

        if (!valid) throw new UserInputError('Invalid credentials.')

        const user = await getUserByEmail({ email: req.body.email })
        if (!user) throw new UserInputError('Invalid credentials.')
        req.user = { id: user.id }

        return next()
      } catch (err) {
        req.log.info({ err }, 'Error while logging in.')
        return res.status(401).send({ err: true, message: 'Invalid credentials.' })
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
        if (!req.body.password) throw new UserInputError('Password missing')

        const user = req.body
        const ip = getIpFromRequest(req)
        if (ip) user.ip = ip
        const source = ip ? ip : 'unknown'
        const rateLimitResult = await getRateLimitResult('USER_CREATE', source)
        if (isRateLimitBreached(rateLimitResult)) {
          return sendRateLimitResponse(res, rateLimitResult)
        }

        // 1. if the server is invite only you must have an invite
        if (serverInfo.inviteOnly && !req.session.token)
          throw new UserInputError(
            'This server is invite only. Please provide an invite id.'
          )

        // 2. if you have an invite it must be valid, both for invite only and public servers
        /** @type {import('@/modules/serverinvites/domain/types').ServerInviteRecord} */
        let invite
        if (req.session.token) {
          invite = await validateServerInviteFactory({
            findServerInvite: findServerInviteFactory({ db })
          })(user.email, req.session.token)
        }

        // 3. at this point we know, that we have one of these cases:
        //    * the server is invite only and the user has a valid invite
        //    * the server public and the user has a valid invite
        //    * the server public and the user doesn't have an invite
        // so we go ahead and register the user
        const userId = await createUser({
          ...user,
          role: invite?.serverRole
        })
        req.user = {
          id: userId,
          email: user.email,
          isNewUser: true,
          isInvite: !!invite
        }
        req.log = req.log.child({ userId })

        // 4. use up all server-only invites the email had attached to it
        await finalizeInvitedServerRegistrationFactory({
          deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
          updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
        })(user.email, userId)

        // Resolve redirect path
        req.authRedirectPath = resolveAuthRedirectPathFactory()(invite)

        return next()
      } catch (err) {
        switch (err.constructor) {
          case PasswordTooShortError:
          case UserInputError:
          case NoInviteFoundError:
            req.log.info({ err }, 'Error while registering.')
            return res.status(400).send({ err: err.message })
          default:
            req.log.error(err, 'Error while registering.')
            return res.status(500).send({ err: err.message })
        }
      }
    },
    finalizeAuth
  )

  return strategy
}
