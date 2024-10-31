import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getAvailableRegionKeysFactory } from '@/modules/multiregion/services/config'

export default {
  ServerMultiRegionConfiguration: {
    availableKeys: async () => {
      const getAvailableRegionKeys = getAvailableRegionKeysFactory()
      return await getAvailableRegionKeys()
    },
    regions: async () => {
      return [] // TODO: Implement
    }
  },
  ServerRegionMutations: {
    create: async () => {
      throw new Error('TODO: implement')
    }
  },
  ServerInfoMutations: {
    multiRegion: () => ({})
  },
  ServerInfo: {
    multiRegion: () => ({})
  }
} as Resolvers
