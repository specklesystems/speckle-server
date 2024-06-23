import type { MockedApolloProviderOptions } from '~~/lib/fake-nuxt-env/components/MockedApolloProvider'
import type { MockedRouteParameters } from '~~/lib/fake-nuxt-env/utils/mockedRouter'

declare module '@storybook/types' {
  interface Parameters {
    /**
     * Options for mocking operations inside the story component
     */
    apolloClient?: MockedApolloProviderOptions
    /**
     * Options for mocking the current route inside the story component
     */
    vueRouter?: MockedRouteParameters
  }
}
