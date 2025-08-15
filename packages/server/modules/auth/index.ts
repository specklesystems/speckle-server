import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

import { registerOrUpdateScopeFactory } from '@/modules/shared/repositories/scopes'
import { moduleLogger } from '@/observability/logging'
import db from '@/db/knex'
import { initializeDefaultAppsFactory } from '@/modules/auth/services/serverApps'
import {
  getAllScopesFactory,
  getAppFactory,
  updateDefaultAppFactory,
  registerDefaultAppFactory,
  createAuthorizationCodeFactory
} from '@/modules/auth/repositories/apps'
import setupStrategiesFactory from '@/modules/auth/strategies'
import githubStrategyBuilderFactory from '@/modules/auth/strategies/github'
import {
  validateServerInviteFactory,
  finalizeInvitedServerRegistrationFactory,
  resolveAuthRedirectPathFactory
} from '@/modules/serverinvites/services/processing'
import {
  findServerInviteFactory,
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import authRestApi from '@/modules/auth/rest/index'
import authScopes from '@/modules/auth/scopes'
import type { AuthStrategyMetadata } from '@/modules/auth/helpers/types'
import azureAdStrategyBuilderFactory from '@/modules/auth/strategies/azureAd'
import googleStrategyBuilderFactory from '@/modules/auth/strategies/google'
import localStrategyBuilderFactory from '@/modules/auth/strategies/local'
import oidcStrategyBuilderFactory from '@/modules/auth/strategies/oidc'
import { throwIfRateLimitedFactory } from '@/modules/core/utils/ratelimiter'
import { passportAuthenticateHandlerBuilderFactory } from '@/modules/auth/services/passportService'
import {
  countAdminUsersFactory,
  getUserByEmailFactory,
  getUserFactory,
  legacyGetUserByEmailFactory,
  legacyGetUserFactory,
  storeUserAclFactory,
  storeUserFactory
} from '@/modules/core/repositories/users'
import {
  createUserFactory,
  findOrCreateUserFactory,
  validateUserPasswordFactory
} from '@/modules/core/services/users/management'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory,
  findPrimaryEmailForUserFactory
} from '@/modules/core/repositories/userEmails'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { isRateLimiterEnabled } from '@/modules/shared/helpers/envHelper'
import { getRegisteredRegionClients } from '@/modules/multiregion/utils/dbSelector'
import { replicateQuery } from '@/modules/shared/helpers/dbHelper'

const findEmail = findEmailFactory({ db })
const requestNewEmailVerification = requestNewEmailVerificationFactory({
  findEmail,
  getUser: getUserFactory({ db }),
  getServerInfo: getServerInfoFactory({ db }),
  deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({
    db
  }),
  renderEmail,
  sendEmail
})

const initializeDefaultApps = initializeDefaultAppsFactory({
  getAllScopes: getAllScopesFactory({ db }),
  getApp: getAppFactory({ db }),
  updateDefaultApp: updateDefaultAppFactory({ db }),
  registerDefaultApp: registerDefaultAppFactory({ db })
})

const validateServerInvite = validateServerInviteFactory({
  findServerInvite: findServerInviteFactory({ db })
})
const finalizeInvitedServerRegistration = finalizeInvitedServerRegistrationFactory({
  deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
  updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
})
const resolveAuthRedirectPath = resolveAuthRedirectPathFactory()

const buildCreateUser = async () => {
  const regionClients = await getRegisteredRegionClients()
  const regionDbs = Object.values(regionClients)

  return createUserFactory({
    getServerInfo: getServerInfoFactory({ db }),
    findEmail,
    storeUser: replicateQuery([db, ...regionDbs], storeUserFactory),
    countAdminUsers: countAdminUsersFactory({ db }),
    storeUserAcl: storeUserAclFactory({ db }),
    validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
      createUserEmail: createUserEmailFactory({ db }),
      ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
      findEmail,
      updateEmailInvites: finalizeInvitedServerRegistrationFactory({
        deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
        updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
      }),
      requestNewEmailVerification
    }),
    emitEvent: getEventBus().emit
  })
}

const commonBuilderDeps = {
  getServerInfo: getServerInfoFactory({ db }),
  getUserByEmail: legacyGetUserByEmailFactory({ db }),
  buildFindOrCreateUser: async () => {
    return findOrCreateUserFactory({
      createUser: await buildCreateUser(),
      findPrimaryEmailForUser: findPrimaryEmailForUserFactory({ db })
    })
  },
  validateServerInvite,
  finalizeInvitedServerRegistration,
  resolveAuthRedirectPath,
  passportAuthenticateHandlerBuilder: passportAuthenticateHandlerBuilderFactory({
    resolveAuthRedirectPath
  })
}
const setupStrategies = setupStrategiesFactory({
  githubStrategyBuilder: githubStrategyBuilderFactory({
    ...commonBuilderDeps
  }),
  azureAdStrategyBuilder: azureAdStrategyBuilderFactory({ ...commonBuilderDeps }),
  googleStrategyBuilder: googleStrategyBuilderFactory({ ...commonBuilderDeps }),
  localStrategyBuilder: localStrategyBuilderFactory({
    ...commonBuilderDeps,
    validateUserPassword: validateUserPasswordFactory({
      getUserByEmail: getUserByEmailFactory({ db })
    }),
    buildCreateUser,
    throwIfRateLimited: throwIfRateLimitedFactory({
      rateLimiterEnabled: isRateLimiterEnabled()
    })
  }),
  oidcStrategyBuilder: oidcStrategyBuilderFactory({ ...commonBuilderDeps }),
  createAuthorizationCode: createAuthorizationCodeFactory({ db }),
  getUser: legacyGetUserFactory({ db }),
  emitEvent: getEventBus().emit
})

let authStrategies: AuthStrategyMetadata[]

export const init: SpeckleModule['init'] = async ({ app }) => {
  moduleLogger.info('🔑 Init auth module')

  // Initialize authn strategies
  authStrategies = await setupStrategies(app)

  // Hoist auth routes
  authRestApi(app)

  // Register core-based scopes
  const registerFunc = registerOrUpdateScopeFactory({ db })
  for (const scope of authScopes) {
    await registerFunc({ scope })
  }
}

export const finalize: SpeckleModule['finalize'] = async () => {
  // Note: we're registering the default apps last as we want to ensure that all
  // scopes have been registered by any other modules.
  await initializeDefaultApps()
}

export const getAuthStrategies = (): AuthStrategyMetadata[] => authStrategies
