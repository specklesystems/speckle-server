import { db } from '@/db/knex'
import { deleteExistingAuthTokensFactory } from '@/modules/auth/repositories'
import { getUserByEmail } from '@/modules/core/repositories/users'
import { getServerInfo } from '@/modules/core/services/generic'
import { updateUserPassword } from '@/modules/core/services/users'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import {
  createTokenFactory,
  deleteTokensFactory,
  getPendingTokenFactory
} from '@/modules/pwdreset/repositories'
import { finalizePasswordResetFactory } from '@/modules/pwdreset/services/finalize'
import { requestPasswordRecoveryFactory } from '@/modules/pwdreset/services/request'
import { Express } from 'express'

export default function (app: Express) {
  // sends a password recovery email.
  app.post('/auth/pwdreset/request', async (req, res) => {
    const requestPasswordRecovery = requestPasswordRecoveryFactory({
      getUserByEmail,
      getPendingToken: getPendingTokenFactory({ db }),
      createToken: createTokenFactory({ db }),
      getServerInfo,
      renderEmail,
      sendEmail
    })

    const email = req.body.email
    await requestPasswordRecovery(email)

    return res.status(200).send('Password reset email sent.')
  })

  // Finalizes password recovery.
  app.post('/auth/pwdreset/finalize', async (req, res) => {
    const finalizePasswordReset = finalizePasswordResetFactory({
      getUserByEmail,
      getPendingToken: getPendingTokenFactory({ db }),
      deleteTokens: deleteTokensFactory({ db }),
      updateUserPassword,
      deleteExistingAuthTokens: deleteExistingAuthTokensFactory({ db })
    })

    if (!req.body.tokenId || !req.body.password) throw new Error('Invalid request.')
    await finalizePasswordReset(req.body.tokenId, req.body.password)

    return res.status(200).send('Password reset. Please log in.')
  })
}
