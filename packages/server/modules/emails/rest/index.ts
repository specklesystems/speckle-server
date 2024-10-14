import { Optional } from '@speckle/shared'
import { EmailVerificationFinalizationError } from '@/modules/emails/errors'
import { finalizeEmailVerificationFactory } from '@/modules/emails/services/verification/finalize'
import type { Express } from 'express'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import {
  deleteVerificationsFactory,
  getPendingTokenFactory
} from '@/modules/emails/repositories'
import { markUserAsVerified } from '@/modules/core/repositories/users'
import { db } from '@/db/knex'
import { HttpMethod, OpenApiDocument } from '@/modules/shared/helpers/typeHelper'

export = (params: { app: Express; openApiDocument: OpenApiDocument }) => {
  const { app, openApiDocument } = params
  app.get('/auth/verifyemail', async (req, res) => {
    try {
      const finalizeEmailVerification = finalizeEmailVerificationFactory({
        getPendingToken: getPendingTokenFactory({ db }),
        markUserAsVerified,
        deleteVerifications: deleteVerificationsFactory({ db })
      })

      await finalizeEmailVerification(req.query.t as Optional<string>)
      return res.redirect(
        new URL('/?emailverifiedstatus=true', getFrontendOrigin()).toString()
      )
    } catch (error) {
      const msg =
        error instanceof EmailVerificationFinalizationError
          ? error.message
          : 'Email verification unexpectedly failed'
      req.log.info({ err: error }, 'Email verification failed.')

      return res.redirect(
        new URL(`/?emailverifiederror=${msg}`, getFrontendOrigin()).toString()
      )
    }
  })
  openApiDocument.registerOperation('/auth/verifyemail', HttpMethod.GET, {
    summary: 'Verify email',
    description: 'Verifies an email address',
    parameters: [
      {
        name: 't',
        in: 'query',
        description: 'Token to verify email',
        required: true,
        schema: {
          type: 'string'
        }
      }
    ],
    responses: {
      302: {
        description: 'Redirects to the home page.'
      }
    }
  })
}
