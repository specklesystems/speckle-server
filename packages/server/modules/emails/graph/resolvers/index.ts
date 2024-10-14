import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { findPrimaryEmailForUserFactory } from '@/modules/core/repositories/userEmails'
import { getUser, getUserByEmail } from '@/modules/core/repositories/users'
import { getServerInfo } from '@/modules/core/services/generic'
import {
  deleteOldAndInsertNewVerificationFactory,
  getPendingTokenFactory
} from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { requestEmailVerificationFactory } from '@/modules/emails/services/verification/request'

const requestEmailVerification = requestEmailVerificationFactory({
  getUser,
  getServerInfo,
  deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({ db }),
  findPrimaryEmailForUser: findPrimaryEmailForUserFactory({ db }),
  sendEmail,
  renderEmail
})

export = {
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
      await requestEmailVerification(userId || '')
      return true
    },
    async requestVerificationByEmail(_parent, args) {
      const { email } = args
      const user = await getUserByEmail(email)
      if (!user?.email || user.verified) return false
      await requestEmailVerification(user.id)
      return true
    }
  }
} as Resolvers
