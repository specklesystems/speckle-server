import { Resolvers } from '@/modules/core/graph/generated/graphql'

import { validateScopes } from '@/modules/shared'
import {
  getStreamHistoryFactory,
  getCommitHistoryFactory,
  getObjectHistoryFactory,
  getUserHistoryFactory,
  getTotalStreamCountFactory,
  getTotalCommitCountFactory,
  getTotalObjectCountFactory,
  getTotalUserCountFactory
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
      return await getTotalObjectCountFactory({ db })()
    },

    async totalUserCount() {
      return await getTotalUserCountFactory({ db })()
    },

    async streamHistory() {
      return await getStreamHistoryFactory({ db })()
    },

    async commitHistory() {
      return await getCommitHistoryFactory({ db })()
    },

    async objectHistory() {
      return await getObjectHistoryFactory({ db })()
    },

    async userHistory() {
      return await getUserHistoryFactory({ db })()
    }
  }
} as Resolvers
