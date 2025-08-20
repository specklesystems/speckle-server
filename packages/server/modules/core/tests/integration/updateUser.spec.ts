import { expect } from 'chai'
import { beforeEachContext } from '@/test/hooks'
import { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import {
  countAdminUsersFactory,
  getUserFactory,
  storeUserAclFactory,
  storeUserFactory,
  updateUserFactory
} from '@/modules/core/repositories/users'
import { expectToThrow } from '@/test/assertionHelper'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { createUserFactory } from '@/modules/core/services/users/management'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { replicateQuery } from '@/modules/shared/helpers/dbHelper'
import { buildBasicTestUser } from '@/test/authHelper'

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
  storeUser: replicateQuery([db], storeUserFactory),
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

const updateUser = updateUserFactory({ db })

describe('Users @core-users', () => {
  beforeEach(async () => {
    await beforeEachContext()
  })

  it('should throw an error if avatar is too big', async () => {
    const longAvatar = ''.padEnd(524288, '1') + '0'
    const err = await expectToThrow(() => updateUser('123456', { avatar: longAvatar }))

    expect(err.message).eq('User avatar is too big, please try a smaller one')
  })

  it('should throw an error if update payload is empty', async () => {
    const err = await expectToThrow(() => updateUser('123456', {}))

    expect(err.message).eq('User update payload empty')
  })

  // this will never actually happen
  it('updates the user email', async () => {
    const userId = await createUser(
      buildBasicTestUser({
        name: 'John Doe',
        email: createRandomEmail(),
        password: createRandomPassword()
      })
    )

    const newEmail = createRandomEmail()
    await updateUser(userId, { email: newEmail }, { skipClean: true })

    const updated = await db('users').where({ id: userId }).first()
    expect(updated.email.toLowerCase()).eq(newEmail.toLowerCase())
  })
})
