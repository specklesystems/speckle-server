import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { initializeRegion } from '@/modules/multiregion/dbSelector'
import { getAvailableRegionConfig } from '@/modules/multiregion/regionConfig'
import {
  getRegionFactory,
  getRegionsFactory,
  storeRegionFactory
} from '@/modules/multiregion/repositories'
import {
  getAvailableRegionKeysFactory,
  getFreeRegionKeysFactory
} from '@/modules/multiregion/services/config'
import { createAndValidateNewRegionFactory } from '@/modules/multiregion/services/management'

export default {
  ServerMultiRegionConfiguration: {
    availableKeys: async () => {
      const getFreeRegionKeys = getFreeRegionKeysFactory({
        getAvailableRegionKeys: getAvailableRegionKeysFactory({
          getAvailableRegionConfig
        }),
        getRegions: getRegionsFactory({ db })
      })
      return await getFreeRegionKeys()
    },
    regions: async () => {
      const getRegions = getRegionsFactory({ db })
      return await getRegions()
    }
  },
  ServerRegionMutations: {
    create: async (_parent, args) => {
      const createAndValidateNewRegion = createAndValidateNewRegionFactory({
        getFreeRegionKeys: getFreeRegionKeysFactory({
          getAvailableRegionKeys: getAvailableRegionKeysFactory({
            getAvailableRegionConfig
          }),
          getRegions: getRegionsFactory({ db })
        }),
        getRegion: getRegionFactory({ db }),
        storeRegion: storeRegionFactory({ db }),
        initializeRegion
      })
      return await createAndValidateNewRegion({ region: args.input })
    }
  },
  ServerRegionItem: {
    id: (parent) => parent.key
  },
  ServerInfoMutations: {
    multiRegion: () => ({})
  },
  ServerInfo: {
    multiRegion: () => ({})
  }
} as Resolvers
