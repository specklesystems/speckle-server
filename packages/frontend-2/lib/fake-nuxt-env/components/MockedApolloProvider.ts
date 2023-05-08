/* eslint-disable @typescript-eslint/no-explicit-any, vue/no-setup-props-destructure */
import { ApolloClient, DefaultOptions } from '@apollo/client/core'
import { InMemoryCache } from '@apollo/client/cache'
import type { Resolvers } from '@apollo/client/core'
import type { ApolloCache } from '@apollo/client/cache'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { defineComponent, h, provide, PropType } from 'vue'
import { Optional } from '@speckle/shared'
import {
  BetterMockLink,
  MockedApolloRequest
} from '~~/lib/fake-nuxt-env/utils/betterMockLink'

/**
 * Vue implementation of the Apollo Mocked Provider, allows us to completely mock out
 * Apollo operations in our stories
 */

/**
 * Keys of Storybook's `parameters.apolloClient` object that can be used to configure Apollo mocks
 */
export interface MockedApolloProviderOptions<
  TSerializedCache = Record<string, unknown>
> {
  mocks?: Array<MockedApolloRequest<any, any>>
  addTypename?: boolean
  defaultOptions?: DefaultOptions
  cache?: ApolloCache<TSerializedCache>
  resolvers?: Resolvers
  childProps?: object
  children?: any
}

export const MockedApolloProvider = defineComponent({
  name: 'MockedApolloProvider',
  props: {
    options: {
      type: Object as PropType<Optional<MockedApolloProviderOptions>>,
      default: undefined
    }
  },
  setup(props, { slots }) {
    const { options } = props
    const { mocks, addTypename, defaultOptions, cache, resolvers } = options || {}

    const client = new ApolloClient({
      cache: cache || new InMemoryCache({ addTypename }),
      defaultOptions,
      link: new BetterMockLink(mocks || []),
      resolvers
    })

    // This will only provide it to children, preventing pollution of mocked clients between stories
    provide(DefaultApolloClient, client)

    return () => [slots.default?.() || h('div')]
  }
})
