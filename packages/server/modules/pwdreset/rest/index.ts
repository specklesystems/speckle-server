import { finalizePasswordReset } from '@/modules/pwdreset/services/finalize'
import { requestPasswordRecovery } from '@/modules/pwdreset/services/request'
import { BadRequestError } from '@/modules/shared/errors'
import { Express } from 'express'

export default function (app: Express) {
  // sends a password recovery email.
  app.post('/auth/pwdreset/request', async (req, res) => {
    const email = req.body.email
    await requestPasswordRecovery(email)

    return res.status(200).send('Password reset email sent.')
  })

  // Finalizes password recovery.
  app.post('/auth/pwdreset/finalize', async (req, res) => {
    if (!req.body.tokenId || !req.body.password)
      throw new BadRequestError('Invalid request.')
    await finalizePasswordReset(req.body.tokenId, req.body.password)

    return res.status(200).send('Password reset. Please log in.')
  })
}
