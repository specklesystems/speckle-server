import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getUserByEmail } from '@/modules/core/repositories/users'
import { getPendingToken } from '@/modules/emails/repositories'
import { requestEmailVerification } from '@/modules/emails/services/verification/request'

export = {
  User: {
    async hasPendingVerification(parent) {
      const email = parent.email
      if (!email) return false

      const token = await getPendingToken({ email })
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
