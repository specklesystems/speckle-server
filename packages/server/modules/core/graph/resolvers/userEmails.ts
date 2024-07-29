import { Resolvers } from '@/modules/core/graph/generated/graphql'
  findEmailsByUserIdFactory,
} from '@/modules/core/repositories/userEmails'
import { db } from '@/db/knex'

export = {
  Query: {
    userEmails: (_parent, _args, ctx) => {
      return findEmailsByUserIdFactory({ db })({ userId: ctx.userId! })
    }
  },
} as Resolvers
