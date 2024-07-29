import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  createUserEmailFactory,
  findEmailsByUserIdFactory,
} from '@/modules/core/repositories/userEmails'
import { db } from '@/db/knex'

export = {
  Query: {
    userEmails: (_parent, _args, ctx) => {
      return findEmailsByUserIdFactory({ db })({ userId: ctx.userId! })
    }
  },
  Mutation: {
    createUserEmail: (_parent, args, ctx) => {
      return createUserEmailFactory({ db })({
        userEmail: {
          userId: ctx.userId!,
          email: args.input.email,
          primary: false
        }
      })
    },
  }
} as Resolvers
