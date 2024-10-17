import { db } from '@/db/knex'
import { UsersEmitter } from '@/modules/core/events/usersEmitter'
import { AllScopes, ServerRoles } from '@/modules/core/helpers/mainConstants'
import { UserRecord } from '@/modules/core/helpers/types'
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
import { getServerInfo } from '@/modules/core/services/generic'
import { createPersonalAccessToken } from '@/modules/core/services/tokens'
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
import { ServerScope } from '@speckle/shared'
import { kebabCase, omit } from 'lodash'

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
  usersEventsEmitter: UsersEmitter.emit
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

/**
 * Create basic user for tests and on success mutate the input object to have
 * the new ID
 */
export async function createTestUser(userObj: BasicTestUser) {
  if (!userObj.password) {
    userObj.password = 'some-random-password-123456789#!@'
  }

  if (!userObj.email) {
    userObj.email = `${kebabCase(userObj.name)}@someemail.com`
  }

  const id = await createUser(omit(userObj, ['id']), { skipPropertyValidation: true })
  userObj.id = id
}

/**
 * Create multiple users for tests and update them to include their ID
 */
export async function createTestUsers(userObjs: BasicTestUser[]) {
  await Promise.all(userObjs.map((o) => createTestUser(o)))
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
