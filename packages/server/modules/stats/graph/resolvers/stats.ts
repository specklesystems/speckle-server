import { Resolvers } from '@/modules/core/graph/generated/graphql'

import { validateScopes } from '@/modules/shared'
import { Roles, Scopes } from '@speckle/shared'
import { throwForNotHavingServerRole } from '@/modules/shared/authz'

const dummyHistory = [
  { '0': 0 },
  { '1': 0 },
  { '2': 0 },
  { '3': 0 },
  { '4': 0 },
  { '5': 0 },
  { '6': 0 },
  { '7': 0 },
  { '8': 0 },
  { '9': 0 },
  { '10': 0 },
  { '11': 0 }
]

export = {
  Query: {
    /**
     * @deprecated('Use admin.serverStatistics')
     */
    async serverStats(_parent, _args, context) {
      await throwForNotHavingServerRole(context, Roles.Server.Admin)
      await validateScopes(context.scopes, Scopes.Server.Stats)
      return {}
    }
  },

  ServerStats: {
    async totalStreamCount() {
      return 0 //deprecated, returning static value
    },

    async totalCommitCount() {
      return 0 //deprecated, returning static value
    },

    async totalObjectCount() {
      return 0 //deprecated, returning static value
    },

    async totalUserCount() {
      return 0 //deprecated, returning static value
    },

    async streamHistory() {
      return dummyHistory //deprecated, returning static value
    },

    async commitHistory() {
      return dummyHistory //deprecated, returning static value
    },

    async objectHistory() {
      return dummyHistory //deprecated, returning static value
    },

    async userHistory() {
      return dummyHistory //deprecated, returning static value
    }
  }
} as Resolvers
