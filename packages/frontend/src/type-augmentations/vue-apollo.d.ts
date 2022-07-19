/**
 * Vue-apollo types are off, they don't define the result() handler for subscriptions
 */

declare module 'vue-apollo/types/options' {
  import { ApolloQueryResult } from 'apollo-client'

  export interface VueApolloSubscriptionDefinition {
    result?: (result: ApolloQueryResult<any>, key: string) => void
    skip?: (() => boolean) | boolean
  }
}

export {}
