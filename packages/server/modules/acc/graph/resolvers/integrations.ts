import type { Resolvers } from '@/modules/core/graph/generated/graphql'

const resolvers: Resolvers = {
  Workspace: {
    integrations: () => ({})
  }
}

export default resolvers
