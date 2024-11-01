import { getAuthStrategies } from '@/modules/auth'
import { Resolvers } from '@/modules/core/graph/generated/graphql'

export = {
  ServerInfo: {
    authStrategies() {
      return getAuthStrategies()
    }
  }
} as Resolvers
