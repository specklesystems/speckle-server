import { Resolvers } from '@/modules/core/graph/generated/graphql'

export = {
  User: {
    async projects() {
      // we only need the empty state for now
      return []
    }
  }
} as Resolvers
