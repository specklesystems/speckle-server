/* eslint-disable no-restricted-imports */
import '../bootstrap.js'
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
import axios from 'axios'
import { asMultiregionalOperation } from '@/modules/shared/command.js'
import { getAllRegisteredDbs } from '@/modules/multiregion/utils/dbSelector.js'

const main = async () => {
  const userInputs: Array<Parameters<ReturnType<typeof createUserFactory>>[0]> = (
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

  await Promise.all(
    userInputs.map(async (userInput) =>
      asMultiregionalOperation(
        async ({ dbTx, txs, emit }) => {
          const createUser = createUserFactory({
            getServerInfo: getServerInfoFactory({ db: dbTx }),
            findEmail: findEmailFactory({ db: dbTx }),
            storeUser: async (...params) => {
              const [user] = await Promise.all(
                txs.map((tx) => storeUserFactory({ db: tx })(...params))
              )

              return user
            },
            countAdminUsers: countAdminUsersFactory({ db: dbTx }),
            storeUserAcl: storeUserAclFactory({ db: dbTx }),
            validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
              createUserEmail: createUserEmailFactory({ db: dbTx }),
              ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({
                db: dbTx
              }),
              findEmail: findEmailFactory({ db: dbTx }),
              updateEmailInvites: finalizeInvitedServerRegistrationFactory({
                deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db: dbTx }),
                updateAllInviteTargets: updateAllInviteTargetsFactory({ db: dbTx })
              }),
              requestNewEmailVerification: requestNewEmailVerificationFactory({
                findEmail: findEmailFactory({ db: dbTx }),
                getUser: getUserFactory({ db: dbTx }),
                getServerInfo: getServerInfoFactory({ db: dbTx }),
                deleteOldAndInsertNewVerification:
                  deleteOldAndInsertNewVerificationFactory({ db: dbTx }),
                renderEmail,
                sendEmail
              })
            }),
            emitEvent: emit
          })

          return await createUser(userInput)
        },
        {
          logger,
          name: 'seedUsers',
          dbs: await getAllRegisteredDbs()
        }
      )
    )
  )
}

void main()
  .then(() => logger.info('created'))
  .catch((e) => logger.error(e, 'failed'))
