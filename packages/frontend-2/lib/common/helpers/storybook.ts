import { merge } from 'lodash-es'
import type { Parameters, StoryObj } from '@storybook/vue3'
import type { Get } from 'type-fest'
import { MockedApolloProviderOptions } from '~~/lib/fake-nuxt-env/components/MockedApolloProvider'
import { MockedRouteParameters } from '~~/lib/fake-nuxt-env/utils/mockedRouter'

/**
 * Vue Play function type
 */
export type VuePlayFunction = NonNullable<Get<StoryObj, 'play'>>

/**
 * SB parameters type adjusted with our own custom parameters
 */
export type StorybookParameters = Parameters & {
  /**
   * Options for mocking operations inside the story component
   */
  apolloClient?: MockedApolloProviderOptions
  /**
   * Options for mocking the current route inside the story component
   */
  vueRouter?: MockedRouteParameters
}

/**
 * Combine multiple stories by merging them
 */
export function mergeStories(
  source: StoryObj,
  ...targetsToApply: Partial<StoryObj>[]
): StoryObj {
  return merge({}, source, ...targetsToApply) as StoryObj
}
