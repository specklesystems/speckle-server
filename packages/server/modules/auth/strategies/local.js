'use strict'
const debug = require('debug')
const {
  createUser,
  updateUser,
  validatePasssword,
  getUserByEmail
} = require('@/modules/core/services/users')
const { getServerInfo } = require('@/modules/core/services/generic')
const { validateInvite, useInvite } = require('@/modules/serverinvites/services')
const { respectsLimits } = require('@/modules/core/services/ratelimits')

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

        if (req.body.suuid && user.suuid !== req.body.suuid) {
          await updateUser(user.id, { suuid: req.body.suuid })
        }

        req.user = { id: user.id }

        next()
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
        user.ip = req.headers['cf-connecting-ip'] || req.connection.remoteAddress || ''
        const ignorePrefixes = [
          '192.168.',
          '10.',
          '127.',
          '172.1',
          '172.2',
          '172.3',
          '::'
        ]
        for (const ipPrefix of ignorePrefixes)
          if (user.ip.startsWith(ipPrefix)) {
            delete user.ip
            break
          }
        if (
          user.ip &&
          !(await respectsLimits({ action: 'USER_CREATE', source: user.ip }))
        ) {
          throw new Error('Blocked due to rate-limiting. Try again later')
        }

        // 1. if the server is invite only you must have an invite
        if (serverInfo.inviteOnly && !req.session.inviteId)
          throw new Error('This server is invite only. Please provide an invite id.')

        // 2. if you have an invite it must be valid, both for invite only and public servers
        if (req.session.inviteId) {
          const isInviteValid = await validateInvite({
            id: req.session.inviteId,
            email: user.email
          })
          if (!isInviteValid)
            throw new Error(
              'Invite email mismatch. Please use the original email the invite was sent to register.'
            )
        }

        // 3. at this point we know, that we have one of these cases:
        //    * the server is invite only and the user has a valid invite
        //    * the server public and the user has a valid invite
        //    * the server public and the user doesn't have an invite
        // so we go ahead and register the user
        const userId = await createUser(user)
        req.user = { id: userId, email: user.email }

        // 4. if the user had an invite, its used up
        if (req.session.inviteId)
          await useInvite({ id: req.session.inviteId, email: user.email })

        return next()
      } catch (err) {
        debug('speckle:errors')(err)
        return res.status(400).send({ err: err.message })
      }
    },
    finalizeAuth
  )

  return strategy
}
