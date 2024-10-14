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
import { ensureError } from '@/modules/shared/helpers/errorHelper'
import { HttpMethod, OpenApiDocument } from '@/modules/shared/helpers/typeHelper'
import { Express } from 'express'

export default function (params: { app: Express; openApiDocument: OpenApiDocument }) {
  const { app, openApiDocument } = params
  // sends a password recovery email.
  app.post('/auth/pwdreset/request', async (req, res) => {
    try {
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
    } catch (e: unknown) {
      req.log.info({ err: e }, 'Error while requesting password recovery.')
      res.status(400).send(ensureError(e).message)
    }
  })
  openApiDocument.registerOperation('/auth/pwdreset/request', HttpMethod.POST, {
    description: 'Reset a password',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                format: 'email'
              }
            },
            required: ['email']
          }
        }
      }
    },
    responses: {
      200: {
        description: 'The password reset workflow was successfully started.'
      }
    }
  })

  // Finalizes password recovery.
  app.post('/auth/pwdreset/finalize', async (req, res) => {
    try {
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
    } catch (e: unknown) {
      req.log.info({ err: e }, 'Error while finalizing password recovery.')
      res.status(400).send(ensureError(e).message)
    }
  })
  openApiDocument.registerOperation('/auth/pwdreset/finalize', HttpMethod.GET, {
    description: 'Finish resetting a password',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              tokenId: {
                type: 'string'
              },
              password: {
                type: 'string'
              }
            },
            required: ['tokenId', 'password']
          }
        }
      }
    },
    responses: {
      200: {
        description: 'The password was successfully reset.'
      }
    }
  })
}
