import { db } from '@/db/knex'
import { AllScopes, ServerRoles } from '@/modules/core/helpers/mainConstants'
import { UserRecord } from '@/modules/core/helpers/types'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  storeApiTokenFactory,
  storePersonalApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory
} from '@/modules/core/repositories/tokens'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import {
  countAdminUsersFactory,
  getUserFactory,
  storeUserAclFactory,
  storeUserFactory
} from '@/modules/core/repositories/users'
import { createPersonalAccessTokenFactory } from '@/modules/core/services/tokens'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { createUserFactory } from '@/modules/core/services/users/management'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { faker } from '@faker-js/faker'
import { ServerScope, wait } from '@speckle/shared'
import { isArray, isNumber, kebabCase, omit, times } from 'lodash'

const getServerInfo = getServerInfoFactory({ db })
const findEmail = findEmailFactory({ db })
const requestNewEmailVerification = requestNewEmailVerificationFactory({
  findEmail,
  getUser: getUserFactory({ db }),
  getServerInfo,
  deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({ db }),
  renderEmail,
  sendEmail
})
const createUser = createUserFactory({
  getServerInfo,
  findEmail,
  storeUser: storeUserFactory({ db }),
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
const createPersonalAccessToken = createPersonalAccessTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  }),
  storePersonalApiToken: storePersonalApiTokenFactory({ db })
})

export type BasicTestUser = {
  name: string
  email: string
  password?: string
  /**
   * Will be set by createTestUser(), but you need to set a default value to ''
   * so that you don't have to check if its empty cause of TS
   */
  id: string
  role?: ServerRoles
} & Partial<UserRecord>

const initTestUser = (user: Partial<BasicTestUser>): BasicTestUser => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  id: '',
  ...user
})

/**
 * Create basic user for tests and on success mutate the input object to have
 * the new ID
 */
export async function createTestUser(userObj?: Partial<BasicTestUser>) {
  const baseUser = initTestUser(userObj || {})

  // Need to set values in both, in case userObj was defined outside of the function and passed in.
  // If we only set on baseUser, the param obj won't be updated
  const setVal = <Key extends keyof BasicTestUser>(
    key: Key,
    val: BasicTestUser[Key]
  ) => {
    baseUser[key] = val
    if (userObj) userObj[key] = val
  }

  if (!baseUser.password) {
    setVal('password', 'some-random-password-123456789#!@')
  }

  if (!baseUser.email) {
    setVal('email', `${kebabCase(baseUser.name)}@someemail.com`)
  }

  const id = await createUser(omit(baseUser, ['id']), { skipPropertyValidation: true })
  setVal('id', id)

  return baseUser
}

export type CreateTestUsersParams = {
  /**
   * Number of users to create. Either this or `users` must be set
   */
  count?: number
  /**
   * The users to create. Either this or `count` must be set
   */
  users?: BasicTestUser[]
  /**
   * Optional mapper to run on each user obj before insertion
   */
  mapper?: (params: { user: BasicTestUser; idx: number }) => BasicTestUser
  /**
   * For pagination purposes it might be imperative that users are serially created to ensure different timestamps
   * and avoid flaky pagination bugs
   */
  serial?: boolean
}

/**
 * Create multiple users for tests and update them to include their ID
 */
export async function createTestUsers(
  usersOrParams: BasicTestUser[] | CreateTestUsersParams
) {
  const params: CreateTestUsersParams = isArray(usersOrParams)
    ? { users: usersOrParams }
    : usersOrParams
  if (!params.users && !isNumber(params.count)) {
    throw new Error('Either count or users must be set')
  }

  let finalUsers = params.users
    ? params.users
    : times(params.count || 1, () => initTestUser({}))

  const mapper = params.mapper
  if (mapper) {
    finalUsers = finalUsers.map((user, idx) => mapper({ user, idx }))
  }

  if (params.serial) {
    const results: BasicTestUser[] = []
    for (const finalUser of finalUsers) {
      results.push(await createTestUser(finalUser))
      await wait(1)
    }
    return results
  } else {
    return await Promise.all(finalUsers.map((o) => createTestUser(o)))
  }
}

/**
 * Create an auth token for the specified user (use only during tests, of course)
 * @param userId User's ID
 * @param Specify scopes you want to allow. Defaults to all scopes.
 */
export async function createAuthTokenForUser(
  userId: string,
  scopes: string[] = AllScopes
): Promise<string> {
  return await createPersonalAccessToken(
    userId,
    'test-runner-token',
    scopes as ServerScope[]
  )
}
