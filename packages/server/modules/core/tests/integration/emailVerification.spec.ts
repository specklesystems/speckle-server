import { describe } from 'mocha'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory,
  updateUserEmailFactory
} from '@/modules/core/repositories/userEmails'
import { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import { markUserEmailAsVerifiedFactory } from '@/modules/core/services/users/emailVerification'
import { expect } from 'chai'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import {
  countAdminUsersFactory,
  getUserFactory,
  storeUserAclFactory,
  storeUserFactory
} from '@/modules/core/repositories/users'
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
import { UsersEmitter } from '@/modules/core/events/usersEmitter'
import { getServerInfoFactory } from '@/modules/core/repositories/server'

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
  usersEventsEmitter: UsersEmitter.emit
})

describe('Verification @user-emails', () => {
  it('should mark user email as verified', async () => {
    const email = createRandomEmail()

    await createUser({
      name: 'John',
      email,
      password: createRandomPassword()
    })

    await markUserEmailAsVerifiedFactory({
      updateUserEmail: updateUserEmailFactory({ db })
    })({ email })

    const userEmail = await findEmailFactory({ db })({ email })
    expect(userEmail).to.be.ok
    expect(userEmail!.verified).to.be.true
  })
})
