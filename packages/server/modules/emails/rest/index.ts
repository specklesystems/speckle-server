import type { Optional } from '@speckle/shared'
import { EmailVerificationFinalizationError } from '@/modules/emails/errors'
import { finalizeEmailVerificationFactory } from '@/modules/emails/services/verification/finalize'
import type { Express } from 'express'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import {
  deleteVerificationsFactory,
  getPendingTokenFactory
} from '@/modules/emails/repositories'
import { db } from '@/db/knex'
import { markUserAsVerifiedFactory } from '@/modules/core/repositories/users'
import { withOperationLogging } from '@/observability/domain/businessLogging'

export default (app: Express) => {
  app.get('/auth/verifyemail', async (req, res) => {
    const logger = req.log
    try {
      const finalizeEmailVerification = finalizeEmailVerificationFactory({
        getPendingToken: getPendingTokenFactory({ db }),
        markUserAsVerified: markUserAsVerifiedFactory({ db }),
        deleteVerifications: deleteVerificationsFactory({ db })
      })

      await withOperationLogging(
        async () => await finalizeEmailVerification(req.query.t as Optional<string>),
        {
          logger,
          operationName: 'finalizeEmailVerification',
          operationDescription: 'Finalize email verification'
        }
      )
      return res.redirect(
        new URL('/?emailverifiedstatus=true', getFrontendOrigin()).toString()
      )
    } catch (error) {
      const msg =
        error instanceof EmailVerificationFinalizationError
          ? error.message
          : 'Email verification unexpectedly failed'
      logger.info({ err: error }, 'Email verification failed.')

      return res.redirect(
        new URL(`/?emailverifiederror=${msg}`, getFrontendOrigin()).toString()
      )
    }
  })
}
