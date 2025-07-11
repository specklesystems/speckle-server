import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  filteredSubscribe,
  TestSubscriptions
} from '@/modules/shared/utils/subscriptions'

export default {
  Query: {
    async _() {
      return `Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn.`
    }
  },
  Subscription: {
    ping: {
      subscribe: filteredSubscribe(TestSubscriptions.Ping, () => {
        return true // allow for all subs
      })
    }
  }
} as Resolvers
