import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  createUserEmailFactory,
  deleteUserEmailFactory,
  findEmailsByUserIdFactory,
  setPrimaryUserEmailFactory
} from '@/modules/core/repositories/userEmails'
import { db } from '@/db/knex'
import { requestNewEmailVerification } from '@/modules/emails/services/verification/request'

export = {
  ActiveUserMutations: {
    emailMutations: () => ({})
  },
  User: {
    async emails(parent) {
      return findEmailsByUserIdFactory({ db })({ userId: parent.id })
    }
  },
  UserEmailMutations: {
    create: async (_parent, args, ctx) => {
      const email = await createUserEmailFactory({ db })({
        userEmail: {
          userId: ctx.userId!,
          email: args.input.email,
          primary: false
        }
      })
      await requestNewEmailVerification(email.id)
      return ctx.loaders.users.getUser.load(ctx.userId!)
    },
    delete: async (_parent, args, ctx) => {
      await deleteUserEmailFactory({ db })({
        userId: ctx.userId!,
        id: args.input.id
      })
      return ctx.loaders.users.getUser.load(ctx.userId!)
    },
    setPrimary: async (_parent, args, ctx) => {
      await setPrimaryUserEmailFactory({ db })({
        userId: ctx.userId!,
        id: args.input.id
      })
      return ctx.loaders.users.getUser.load(ctx.userId!)
    },
    requestNewEmailVerification: async (_parent, args) => {
      await requestNewEmailVerification(args.input.id)
      return null
    }
  }
} as Resolvers
