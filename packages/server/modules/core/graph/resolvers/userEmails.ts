import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  createUserEmailFactory,
  deleteUserEmailFactory,
  setPrimaryUserEmailFactory
} from '@/modules/core/repositories/userEmails'
import { db } from '@/db/knex'

export = {
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
    deleteUserEmail: (_parent, args, ctx) => {
      return deleteUserEmailFactory({ db })({
        userId: ctx.userId!,
        id: args.input.id
      })
    },
    setPrimaryUserEmail: (_parent, args, ctx) => {
      return setPrimaryUserEmailFactory({ db })({
        userId: ctx.userId!,
        id: args.input.id
      })
    }
  }
} as Resolvers
