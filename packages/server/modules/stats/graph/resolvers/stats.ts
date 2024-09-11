import { Resolvers } from '@/modules/core/graph/generated/graphql'

import { validateScopes } from '@/modules/shared'
import {
  getStreamHistory,
  getCommitHistory,
  getObjectHistory,
  getUserHistory,
  getTotalStreamCountFactory,
  getTotalCommitCountFactory,
  getTotalObjectCount,
  getTotalUserCount
} from '@/modules/stats/repositories/index'
import { Roles, Scopes } from '@speckle/shared'
import { throwForNotHavingServerRole } from '@/modules/shared/authz'
import { db } from '@/db/knex'

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
      return await getTotalStreamCountFactory({ db })()
    },

    async totalCommitCount() {
      return await getTotalCommitCountFactory({ db })()
    },

    async totalObjectCount() {
      return await getTotalObjectCount()
    },

    async totalUserCount() {
      return await getTotalUserCount()
    },

    async streamHistory() {
      return await getStreamHistory()
    },

    async commitHistory() {
      return await getCommitHistory()
    },

    async objectHistory() {
      return await getObjectHistory()
    },

    async userHistory() {
      return await getUserHistory()
    }
  }
} as Resolvers
