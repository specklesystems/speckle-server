/* eslint-disable @typescript-eslint/no-explicit-any, vue/no-setup-props-destructure */
import { ApolloClient, DefaultOptions } from '@apollo/client/core'
import { InMemoryCache } from '@apollo/client/cache'
import { MockLink, MockedResponse } from '@apollo/client/testing/core'
import type { ApolloLink } from '@apollo/client/link/core'
import type { Resolvers } from '@apollo/client/core'
import type { ApolloCache } from '@apollo/client/cache'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { defineComponent, h, provide, PropType } from 'vue'
import { Optional } from '@speckle/shared'

/**
 * Vue implementation of the Apollo Mocked Provider, allows us to completely mock out
 * Apollo operations in our stories
 */

export interface MockedProviderOptions<TSerializedCache = Record<string, unknown>> {
  mocks?: ReadonlyArray<MockedResponse>
  addTypename?: boolean
  defaultOptions?: DefaultOptions
  cache?: ApolloCache<TSerializedCache>
  resolvers?: Resolvers
  childProps?: object
  children?: any
  link?: ApolloLink
}

export const MockedProvider = defineComponent({
  name: 'MockedProvider',
  props: {
    options: {
      type: Object as PropType<Optional<MockedProviderOptions>>,
      default: undefined
    }
  },
  setup(props, { slots }) {
    const { options } = props
    const { mocks, addTypename, defaultOptions, cache, resolvers, link } = options || {}

    const client = new ApolloClient({
      cache: cache || new InMemoryCache({ addTypename }),
      defaultOptions,
      link: link || new MockLink(mocks || [], addTypename),
      resolvers
    })

    // This will only provide it to children, preventing pollution of mocked clients between stories
    provide(DefaultApolloClient, client)

    return () => [slots.default?.() || h('div')]
  }
})
