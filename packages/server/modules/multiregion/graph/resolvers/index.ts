import { db } from '@/db/knex'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { initializeRegion as initializeDb } from '@/modules/multiregion/utils/dbSelector'
import { getAvailableRegionConfig } from '@/modules/multiregion/regionConfig'
import {
  getRegionFactory,
  getRegionsFactory,
  storeRegionFactory,
  updateRegionFactory
} from '@/modules/multiregion/repositories'
import {
  getAvailableRegionKeysFactory,
  getFreeRegionKeysFactory
} from '@/modules/multiregion/services/config'
import {
  createAndValidateNewRegionFactory,
  initializeRegionClients,
  updateAndValidateRegionFactory
} from '@/modules/multiregion/services/management'
import { initializeRegion as initializeBlobStorage } from '@/modules/multiregion/utils/blobStorageSelector'
import { withOperationLogging } from '@/observability/domain/businessLogging'
import { scheduleJob } from '@/modules/multiregion/services/queue'

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
    create: async (_parent, args, ctx) => {
      const logger = ctx.log.child({
        multiRegionKey: args.input.key
      })
      const createAndValidateNewRegion = createAndValidateNewRegionFactory({
        getFreeRegionKeys: getFreeRegionKeysFactory({
          getAvailableRegionKeys: getAvailableRegionKeysFactory({
            getAvailableRegionConfig
          }),
          getRegions: getRegionsFactory({ db })
        }),
        getRegion: getRegionFactory({ db }),
        storeRegion: storeRegionFactory({ db }),
        initializeRegion: initializeRegionClients({
          initializeDb,
          initializeBlobStorage
        }),
        scheduleJob
      })
      return await withOperationLogging(
        async () => await createAndValidateNewRegion({ region: args.input }),
        {
          logger,
          operationName: 'createRegion',
          operationDescription: 'Create a new region'
        }
      )
    },
    update: async (_parent, args, ctx) => {
      const logger = ctx.log.child({
        multiRegionKey: args.input.key
      })
      const updateAndValidateRegion = updateAndValidateRegionFactory({
        getRegion: getRegionFactory({ db }),
        updateRegion: updateRegionFactory({ db })
      })

      return await withOperationLogging(
        async () => await updateAndValidateRegion({ input: args.input }),
        {
          logger,
          operationName: 'updateRegion',
          operationDescription: 'Update a region'
        }
      )
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
