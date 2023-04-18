/* eslint-disable @typescript-eslint/no-unsafe-return */
import { isArray, merge, mergeWith } from 'lodash-es'
import type { Parameters, StoryObj } from '@storybook/vue3'
import type { Get } from 'type-fest'
import { MockedApolloProviderOptions } from '~~/lib/fake-nuxt-env/components/MockedApolloProvider'
import { MockedRouteParameters } from '~~/lib/fake-nuxt-env/utils/mockedRouter'
import { NonUndefined } from '~~/lib/common/helpers/type'
import { Component } from 'vue'
import DefaultLayout from '~~/layouts/default.vue'
import {
  mockActiveUserQuery,
  mockProfileEditDialogQuery
} from '~~/lib/auth/mocks/activeUser'

export type ApolloMockData<T> = T extends Record<string | number | symbol, unknown>
  ? Required<{
      [K in keyof T]: ApolloMockData<T[K]>
    }>
  : T extends Record<string | number | symbol, unknown>[]
  ? Array<Required<ApolloMockData<T[0]>>>
  : NonUndefined<T>

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
export function mergeStories<S = StoryObj>(
  source: S,
  ...targetsToApply: Partial<S>[]
): S {
  return merge({}, source, ...targetsToApply) as S
}

export function buildPageStory(params: {
  page: Component
  layout?: Component
  story?: Partial<StoryObj>
  activeUserSettings?: Partial<{
    isLoggedIn: boolean
  }>
}): StoryObj {
  const { layout = DefaultLayout, page, story, activeUserSettings } = params
  const { isLoggedIn = true } = activeUserSettings || {}

  const baseStory: StoryObj = {
    render: (args) => ({
      components: { Layout: layout, AppPage: page },
      setup: () => ({ args }),
      template: `<Layout><AppPage v-bind="args"/></Layout>`
    }),
    parameters: {
      apolloClient: {
        mocks: [
          mockActiveUserQuery({ forceGuest: !isLoggedIn }),
          mockProfileEditDialogQuery({ forceGuest: !isLoggedIn })
        ]
      }
    }
  }

  // concat arrays instead of overwriting them
  const ret = mergeWith(
    {} as StoryObj,
    baseStory,
    story || {},
    (objValue, srcValue) => {
      if (isArray(objValue) && isArray(srcValue)) {
        return objValue.concat(srcValue)
      }
    }
  )
  return ret
}
