import { Optional } from '@speckle/shared'
import { EmailVerificationFinalizationError } from '@/modules/emails/errors'
import { finalizeEmailVerification } from '@/modules/emails/services/verification/finalize'
import type { Express } from 'express'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'

export = (app: Express) => {
  app.get('/auth/verifyemail', async (req, res) => {
    try {
      await finalizeEmailVerification(req.query.t as Optional<string>)
      return res.redirect(
        new URL('/?emailverifiedstatus=true', getFrontendOrigin()).toString()
      )
    } catch (error) {
      const msg =
        error instanceof EmailVerificationFinalizationError
          ? error.message
          : 'Email verification unexpectedly failed'

      return res.redirect(
        new URL(`/?emailverifiederror=${msg}`, getFrontendOrigin()).toString()
      )
    }
  })
}
