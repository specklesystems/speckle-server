import { db } from '@/db/knex'
import { deleteExistingAuthTokensFactory } from '@/modules/auth/repositories'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  getUserByEmailFactory,
  getUserFactory,
  updateUserFactory
} from '@/modules/core/repositories/users'
import { changePasswordFactory } from '@/modules/core/services/users/management'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { getAllRegisteredDbs } from '@/modules/multiregion/utils/dbSelector'
import {
  createTokenFactory,
  deleteTokensFactory,
  getPendingTokenFactory
} from '@/modules/pwdreset/repositories'
import { finalizePasswordResetFactory } from '@/modules/pwdreset/services/finalize'
import { requestPasswordRecoveryFactory } from '@/modules/pwdreset/services/request'
import { asMultiregionalOperation } from '@/modules/shared/command'
import { BadRequestError } from '@/modules/shared/errors'
import { withOperationLogging } from '@/observability/domain/businessLogging'
import { ensureError } from '@speckle/shared'
import type { Express } from 'express'
import { UserNotFoundError } from '@/modules/core/errors/user'

export default function (app: Express) {
  const getUserByEmail = getUserByEmailFactory({ db })

  // sends a password recovery email.
  app.post('/auth/pwdreset/request', async (req, res) => {
    const responseMessage = 'Password reset email sent.'
    try {
      const email = req.body.email
      const logger = req.log.child({ email })
      const requestPasswordRecovery = requestPasswordRecoveryFactory({
        getUserByEmail,
        getPendingToken: getPendingTokenFactory({ db }),
        createToken: createTokenFactory({ db }),
        getServerInfo: getServerInfoFactory({ db }),
        renderEmail,
        sendEmail
      })

      await withOperationLogging(async () => await requestPasswordRecovery(email), {
        logger,
        operationName: 'requestPasswordRecovery',
        operationDescription: `Requesting password recovery`
      })

      return res.status(200).send(responseMessage)
    } catch (e: unknown) {
      const err = ensureError(e, 'Unknown error while requesting password recovery')
      req.log.info({ err }, 'Error while requesting password recovery.')
      if (err instanceof UserNotFoundError) {
        // always 200 and use same response message to avoid user enumeration
        res.status(200).send(responseMessage)
      } else {
        res.status(400).send(err.message)
      }
    }
  })

  // Finalizes password recovery.
  app.post('/auth/pwdreset/finalize', async (req, res) => {
    const logger = req.log
    try {
      if (!req.body.tokenId || !req.body.password)
        throw new BadRequestError('Invalid request.')
      await asMultiregionalOperation(
        async ({ mainDb, allDbs }) => {
          const finalizePasswordReset = finalizePasswordResetFactory({
            getUserByEmail,
            getPendingToken: getPendingTokenFactory({ db: mainDb }),
            deleteTokens: deleteTokensFactory({ db: mainDb }),
            updateUserPassword: changePasswordFactory({
              getUser: getUserFactory({ db: mainDb }),
              updateUser: async (...params) => {
                const [res] = await Promise.all(
                  allDbs.map((db) => updateUserFactory({ db })(...params))
                )

                return res
              }
            }),
            deleteExistingAuthTokens: deleteExistingAuthTokensFactory({ db: mainDb })
          })

          return await finalizePasswordReset(req.body.tokenId, req.body.password)
        },
        {
          logger,
          dbs: await getAllRegisteredDbs(),
          name: 'finalizePasswordReset',
          description: `Finalizing password reset`
        }
      )

      return res.status(200).send('Password reset. Please log in.')
    } catch (e: unknown) {
      req.log.info({ err: e }, 'Error while finalizing password recovery.')
      res.status(400).send(ensureError(e).message)
    }
  })
}
