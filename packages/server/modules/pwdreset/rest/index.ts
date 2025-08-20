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
import { getRegisteredRegionClients } from '@/modules/multiregion/utils/dbSelector'
import {
  createTokenFactory,
  deleteTokensFactory,
  getPendingTokenFactory
} from '@/modules/pwdreset/repositories'
import { finalizePasswordResetFactory } from '@/modules/pwdreset/services/finalize'
import { requestPasswordRecoveryFactory } from '@/modules/pwdreset/services/request'
import { BadRequestError } from '@/modules/shared/errors'
import { replicateQuery } from '@/modules/shared/helpers/dbHelper'
import { withOperationLogging } from '@/observability/domain/businessLogging'
import { ensureError } from '@speckle/shared'
import type { Express } from 'express'

export default function (app: Express) {
  const getUserByEmail = getUserByEmailFactory({ db })

  // sends a password recovery email.
  app.post('/auth/pwdreset/request', async (req, res) => {
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

      return res.status(200).send('Password reset email sent.')
    } catch (e: unknown) {
      req.log.info({ err: e }, 'Error while requesting password recovery.')
      res.status(400).send(ensureError(e).message)
    }
  })

  // Finalizes password recovery.
  app.post('/auth/pwdreset/finalize', async (req, res) => {
    const logger = req.log
    try {
      const regionClients = await getRegisteredRegionClients()
      const regionDbs = Object.values(regionClients)

      const finalizePasswordReset = finalizePasswordResetFactory({
        getUserByEmail,
        getPendingToken: getPendingTokenFactory({ db }),
        deleteTokens: deleteTokensFactory({ db }),
        updateUserPassword: changePasswordFactory({
          getUser: getUserFactory({ db }),
          updateUser: replicateQuery([db, ...regionDbs], updateUserFactory)
        }),
        deleteExistingAuthTokens: deleteExistingAuthTokensFactory({ db })
      })

      if (!req.body.tokenId || !req.body.password)
        throw new BadRequestError('Invalid request.')
      await withOperationLogging(
        async () => await finalizePasswordReset(req.body.tokenId, req.body.password),
        {
          logger,
          operationName: 'finalizePasswordReset',
          operationDescription: `Finalizing password reset`
        }
      )

      return res.status(200).send('Password reset. Please log in.')
    } catch (e: unknown) {
      req.log.info({ err: e }, 'Error while finalizing password recovery.')
      res.status(400).send(ensureError(e).message)
    }
  })
}
