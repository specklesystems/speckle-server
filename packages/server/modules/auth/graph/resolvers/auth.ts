import { getAuthStrategies } from '@/modules/auth'
import { Resolvers } from '@/modules/core/graph/generated/graphql'

export default {
  ServerInfo: {
    authStrategies() {
      return getAuthStrategies()
    }
  }
} as Resolvers
