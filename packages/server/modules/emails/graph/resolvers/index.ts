import { Resolvers } from '@/modules/core/graph/generated/graphql'
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
    }
  }
} as Resolvers
