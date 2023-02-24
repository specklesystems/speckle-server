import { finalizePasswordReset } from '@/modules/pwdreset/services/finalize'
import { requestPasswordRecovery } from '@/modules/pwdreset/services/request'
import { ensureError } from '@/modules/shared/helpers/errorHelper'
import { Express } from 'express'

export default function (app: Express) {
  // sends a password recovery email.
  app.post('/auth/pwdreset/request', async (req, res) => {
    try {
      const email = req.body.email
      await requestPasswordRecovery(email)

      return res.status(200).send('Password reset email sent.')
    } catch (e: unknown) {
      res.status(400).send(ensureError(e).message)
    }
  })

  // Finalizes password recovery.
  app.post('/auth/pwdreset/finalize', async (req, res) => {
    try {
      if (!req.body.tokenId || !req.body.password) throw new Error('Invalid request.')
      await finalizePasswordReset(req.body.tokenId, req.body.password)

      return res.status(200).send('Password reset. Please log in.')
    } catch (e: unknown) {
      res.status(400).send(ensureError(e).message)
    }
  })
}
