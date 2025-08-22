import type { Optional } from '@speckle/shared'
import { EmailVerificationFinalizationError } from '@/modules/emails/errors'
import { finalizeEmailVerificationFactory } from '@/modules/emails/services/verification/finalize'
import type { Express } from 'express'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import {
  deleteVerificationsFactory,
  getPendingTokenFactory
} from '@/modules/emails/repositories'
import { markUserAsVerifiedFactory } from '@/modules/core/repositories/users'
import { markUserEmailAsVerifiedFactory } from '@/modules/core/services/users/emailVerification'
import { updateUserEmailFactory } from '@/modules/core/repositories/userEmails'
import { getAllRegisteredDbs } from '@/modules/multiregion/utils/dbSelector'
import { asMultiregionalOperation } from '@/modules/shared/command'

export default (app: Express) => {
  app.get('/auth/verifyemail', async (req, res) => {
    const logger = req.log
    try {
      await asMultiregionalOperation(
        async ({ dbTx, txs }) => {
          const finalizeEmailVerification = finalizeEmailVerificationFactory({
            getPendingToken: getPendingTokenFactory({ db: dbTx }),
            markUserAsVerified: async (params) => {
              const [res] = await Promise.all(
                txs.map((tx) => markUserAsVerifiedFactory({ db: tx })(params))
              )
              return res
            },
            deleteVerifications: deleteVerificationsFactory({ db: dbTx }),
            markUserEmailAsVerified: markUserEmailAsVerifiedFactory({
              updateUserEmail: updateUserEmailFactory({ db: dbTx })
            })
          })

          return await finalizeEmailVerification(req.query.t as Optional<string>)
        },
        {
          logger,
          dbs: await getAllRegisteredDbs(),
          name: 'finalizeEmailVerification',
          description: 'Finalize email verification'
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
