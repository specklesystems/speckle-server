import { db } from '@/db/knex'
import type { ServerRoles } from '@/modules/core/helpers/mainConstants'
import { AllScopes } from '@/modules/core/helpers/mainConstants'
import { createRandomEmail } from '@/modules/core/helpers/testHelpers'
import type { UserRecord } from '@/modules/core/helpers/types'
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
import type { UserWithOptionalRole } from '@/modules/core/repositories/users'
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
import { getRegisteredRegionClients } from '@/modules/multiregion/utils/dbSelector'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import { replicateQuery } from '@/modules/shared/helpers/dbHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { createTestContext, testApolloServer } from '@/test/graphqlHelper'
import { isMultiRegionTestMode } from '@/test/speckle-helpers/regions'
import { faker } from '@faker-js/faker'
import type { ServerScope } from '@speckle/shared'
import { wait } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import type { Knex } from 'knex'
import { assign, isArray, isNumber, omit, times } from 'lodash-es'

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
  /**
   * Even if disabled server-wide, allow personal emails for this user
   */
  allowPersonalEmail?: boolean
} & Partial<UserRecord>

const initTestUser = (user: Partial<BasicTestUser>): BasicTestUser => ({
  name: faker.person.fullName(),
  email: `${cryptoRandomString({ length: 15 })}@example.org`,
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
    setVal('email', createRandomEmail().toLowerCase())
  }

  const regionClients = await getRegisteredRegionClients()
  const regionDbs = Object.values(regionClients)

  const dbs: [Knex, ...Knex[]] = isMultiRegionTestMode() ? [db, ...regionDbs] : [db]

  const createUser = createUserFactory({
    getServerInfo,
    findEmail,
    storeUser: replicateQuery(dbs, storeUserFactory),
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

  const id = await createUser(omit(baseUser, ['id', 'allowPersonalEmail']), {
    skipPropertyValidation: true,
    allowPersonalEmail: baseUser.allowPersonalEmail
  })
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

export const buildBasicTestUser = (overrides?: Partial<BasicTestUser>): BasicTestUser =>
  assign(
    {
      id: cryptoRandomString({ length: 10 }),
      name: cryptoRandomString({ length: 10 }),
      email: createRandomEmail(),
      verified: true
    },
    overrides
  )

export const buildTestUserWithOptionalRole = (
  overrides?: Partial<UserWithOptionalRole>
): UserWithOptionalRole =>
  assign(
    {
      suuid: cryptoRandomString({ length: 10 }),
      createdAt: new Date(),
      id: cryptoRandomString({ length: 10 }),
      bio: cryptoRandomString({ length: 10 }),
      company: cryptoRandomString({ length: 10 }),
      avatar: cryptoRandomString({ length: 10 }),
      name: cryptoRandomString({ length: 10 }),
      email: createRandomEmail(),
      verified: true,
      role: null
    },
    overrides
  )

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

/**
 * Login a user for tests and return the ApolloServer instance
 */
export async function login(user: Pick<BasicTestUser, 'id' | 'role'>) {
  const token = await createAuthTokenForUser(user.id, AllScopes)
  return await testApolloServer({
    context: await createTestContext({
      auth: true,
      userId: user.id,
      token,
      role: user.role,
      scopes: AllScopes
    })
  })
}
