import { db } from '@/db/knex'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { findPrimaryEmailForUserFactory } from '@/modules/core/repositories/userEmails'
import {
  getUserByEmailFactory,
  getUserFactory
} from '@/modules/core/repositories/users'
import {
  deleteOldAndInsertNewVerificationFactory,
  getPendingTokenFactory
} from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { requestEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { withOperationLogging } from '@/observability/domain/businessLogging'

const getUser = getUserFactory({ db })
const requestEmailVerification = requestEmailVerificationFactory({
  getUser,
  getServerInfo: getServerInfoFactory({ db }),
  deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({ db }),
  findPrimaryEmailForUser: findPrimaryEmailForUserFactory({ db }),
  sendEmail,
  renderEmail
})
const getUserByEmail = getUserByEmailFactory({ db })

export default {
  User: {
    async hasPendingVerification(parent) {
      const email = parent.email
      if (!email) return false

      const token = await getPendingTokenFactory({ db })({ email })
      return !!token
    }
  },
  Mutation: {
    async requestVerification(_parent, _args, ctx) {
      const { userId } = ctx
      await withOperationLogging(
        async () => await requestEmailVerification(userId || ''),
        {
          logger: ctx.log,
          operationName: 'requestEmailVerification',
          operationDescription: 'Request email verification'
        }
      )
      return true
    },
    async requestVerificationByEmail(_parent, args, ctx) {
      const { email } = args
      const user = await getUserByEmail(email)
      if (!user?.email || user.verified) return false
      await withOperationLogging(async () => await requestEmailVerification(user.id), {
        logger: ctx.log,
        operationName: 'requestEmailVerificationFromEmail',
        operationDescription: `Request verification by email`
      })
      return true
    }
  }
} as Resolvers
