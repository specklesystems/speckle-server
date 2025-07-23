import { getAuthStrategies } from '@/modules/auth'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'

export default {
  ServerInfo: {
    authStrategies() {
      return getAuthStrategies()
    }
  }
} as Resolvers
