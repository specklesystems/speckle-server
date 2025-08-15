/* eslint-disable no-restricted-imports */
import '../bootstrap.js'
import { db } from '@/db/knex'
import { logger } from '@/observability/logging'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  findEmailFactory,
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory
} from '@/modules/core/repositories/userEmails'
import {
  getUserFactory,
  storeUserFactory,
  countAdminUsersFactory,
  storeUserAclFactory
} from '@/modules/core/repositories/users'
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
import axios from 'axios'
import { replicateQuery } from '@/modules/shared/helpers/dbHelper.js'

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

const main = async () => {
  const userInputs: Array<Parameters<typeof createUser>[0]> = (
    await axios.get('https://randomuser.me/api/?results=250')
  ).data.results.map(
    (user: {
      name: { first: string; last: string }
      email: string
      login: { password: string }
    }) => {
      return {
        name: `${user.name.first} ${user.name.last}`,
        email: user.email,
        password: `${user.login.password}${user.login.password}`
      }
    }
  )

  await Promise.all(userInputs.map((userInput) => createUser(userInput)))
}

void main()
  .then(() => logger.info('created'))
  .catch((e) => logger.error(e, 'failed'))
