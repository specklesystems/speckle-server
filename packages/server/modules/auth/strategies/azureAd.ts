/* istanbul ignore file */
import passport from 'passport'
import { OIDCStrategy, IProfile, VerifyCallback } from 'passport-azure-ad'
import { findOrCreateUser, getUserByEmail } from '@/modules/core/services/users'
import { getServerInfo } from '@/modules/core/services/generic'
import {
  validateServerInviteFactory,
  finalizeInvitedServerRegistrationFactory,
  resolveAuthRedirectPathFactory
} from '@/modules/serverinvites/services/processing'
import { passportAuthenticate } from '@/modules/auth/services/passportService'
import {
  UserInputError,
  UnverifiedEmailSSOLoginError
} from '@/modules/core/errors/userinput'
import db from '@/db/knex'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory,
  findServerInviteFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { ServerInviteResourceType } from '@/modules/serverinvites/domain/constants'
import { getResourceTypeRole } from '@/modules/serverinvites/helpers/core'
import { AuthStrategyBuilder } from '@/modules/auth/helpers/types'
import {
  getAzureAdClientId,
  getAzureAdClientSecret,
  getAzureAdIdentityMetadata,
  getAzureAdIssuer,
  getServerOrigin
} from '@/modules/shared/helpers/envHelper'
import type { Request } from 'express'
import { ensureError, Optional } from '@speckle/shared'

const azureAdStrategyBuilder: AuthStrategyBuilder = async (
  app,
  sessionMiddleware,
  moveAuthParamsToSessionMiddleware,
  finalizeAuthMiddleware
) => {
  const strategy = new OIDCStrategy(
    {
      identityMetadata: getAzureAdIdentityMetadata(),
      clientID: getAzureAdClientId(),
      responseType: 'code id_token',
      responseMode: 'form_post',
      issuer: getAzureAdIssuer(),
      redirectUrl: new URL('/auth/azure/callback', getServerOrigin()).toString(),
      allowHttpForRedirectUrl: true,
      clientSecret: getAzureAdClientSecret(),
      scope: ['profile', 'email', 'openid'],
      loggingLevel: process.env.NODE_ENV === 'development' ? 'info' : 'error',
      passReqToCallback: true
    },
    // Dunno why TS isn't picking up on the types automatically
    async (
      _req: Request,
      _iss: string,
      _sub: string,
      profile: IProfile,
      _accessToken: string,
      _refreshToken: string,
      done: VerifyCallback
    ) => {
      done(null, profile)
    }
  )

  passport.use(strategy)

  // 1. Auth init
  app.get(
    '/auth/azure',
    sessionMiddleware,
    moveAuthParamsToSessionMiddleware,
    passportAuthenticate('azuread-openidconnect')
  )

  // 2. Auth finish callback
  app.post(
    '/auth/azure/callback',
    sessionMiddleware,
    passportAuthenticate('azuread-openidconnect'),
    async (req, _res, next) => {
      const serverInfo = await getServerInfo()

      try {
        // This is the only strategy that does its own type for req.user - easier to force type cast for now
        // than to refactor everything
        const profile = req.user as Optional<IProfile>
        if (!profile) {
          throw new Error('No profile provided by Azure AD')
        }

        const user = {
          email: profile._json.email,
          name: profile._json.name || profile.displayName
        }

        const existingUser = await getUserByEmail({ email: user.email })

        if (existingUser && !existingUser.verified) {
          throw new UnverifiedEmailSSOLoginError(undefined, {
            info: {
              email: user.email
            }
          })
        }

        // if there is an existing user, go ahead and log them in (regardless of
        // whether the server is invite only or not).
        if (existingUser) {
          const myUser = await findOrCreateUser({
            user
          })
          // ID is used later for verifying access token
          req.user = {
            ...profile,
            id: myUser.id,
            email: myUser.email
          }
          return next()
        }

        // if the server is not invite only, go ahead and log the user in.
        if (!serverInfo.inviteOnly) {
          const myUser = await findOrCreateUser({
            user
          })

          // ID is used later for verifying access token
          req.user = {
            ...profile,
            id: myUser.id,
            email: myUser.email,
            isNewUser: myUser.isNewUser
          }

          // process invites
          if (myUser.isNewUser) {
            await finalizeInvitedServerRegistrationFactory({
              deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
              updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
            })(user.email, myUser.id)
          }

          return next()
        }

        // if the server is invite only and we have no invite id, throw.
        if (serverInfo.inviteOnly && !req.session.token) {
          throw new UserInputError(
            'This server is invite only. Please authenticate yourself through a valid invite link.'
          )
        }

        // validate the invite
        const validInvite = await validateServerInviteFactory({
          findServerInvite: findServerInviteFactory({ db })
        })(user.email, req.session.token)

        // create the user
        const myUser = await findOrCreateUser({
          user: {
            ...user,
            role: validInvite
              ? getResourceTypeRole(validInvite.resource, ServerInviteResourceType)
              : undefined
          }
        })

        // ID is used later for verifying access token
        req.user = {
          ...profile,
          id: myUser.id,
          email: myUser.email,
          isNewUser: myUser.isNewUser,
          isInvite: !!validInvite
        }

        req.log = req.log.child({ userId: myUser.id })

        // use the invite
        await finalizeInvitedServerRegistrationFactory({
          deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
          updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
        })(user.email, myUser.id)

        // Resolve redirect path
        req.authRedirectPath = resolveAuthRedirectPathFactory()(validInvite)

        // return to the auth flow
        return next()
      } catch (err) {
        const e = ensureError(
          err,
          'Unexpected issue occured while authenticating with Azure AD'
        )

        switch (e.constructor) {
          case UserInputError:
            req.log.info(
              { e },
              'User input error during Azure AD authentication callback.'
            )
            break
          default:
            req.log.error(e, 'Error during Azure AD authentication callback.')
        }
        return next()
      }
    },
    finalizeAuthMiddleware
  )

  return {
    id: 'azuread',
    name: process.env.AZURE_AD_ORG_NAME || 'Microsoft',
    icon: 'mdi-microsoft',
    color: 'blue darken-3',
    url: '/auth/azure',
    callbackUrl: new URL('/auth/azure/callback', getServerOrigin()).toString()
  }
}

export = azureAdStrategyBuilder
