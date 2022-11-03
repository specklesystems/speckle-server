import IntegrationStoryDemo from '~/components/IntegrationStoryDemo.vue'
import { Meta, Story } from '@storybook/vue3'
import {
  IntegrationStoryDemoServerInfoQueryFragmentFragment,
  InternalTestDataQuery
} from '~~/lib/common/generated/gql/graphql'
import { MockedProviderOptions } from '~~/lib/fake-nuxt-env/components/MockedProvider'
import { fakeInternalQuery } from '~~/lib/fake-nuxt-env/graphql/integrationStoryDemo'

export default {
  component: IntegrationStoryDemo
} as Meta

export const Default: Story = {
  render: (args) => ({
    components: { IntegrationStoryDemo },
    setup() {
      // Feeding in external query data
      const serverInfo: IntegrationStoryDemoServerInfoQueryFragmentFragment = {
        blobSizeLimitBytes: 1000,
        name: 'mocked server name!',
        company: 'mocked company',
        description: 'mocked descriptioN!',
        adminContact: 'mock@mock.com',
        canonicalUrl: 'http://mock.com',
        termsOfService: 'n/a',
        inviteOnly: false,
        version: 'X.X.X'
      }

      return { args, serverInfo }
    },
    template: `<integration-story-demo v-bind="args" :server-info="serverInfo"/>`
  }),
  parameters: {
    // Feeding in internal query data
    apolloClient: {
      mocks: [
        {
          request: { query: fakeInternalQuery },
          result: {
            data: {
              testNumber: 1337,
              testList: [
                { foo: 'this is', bar: 'mocked!' },
                { foo: 'and this', bar: 'is also' }
              ]
            } as InternalTestDataQuery
          }
        }
      ]
    } as MockedProviderOptions
  }
}
