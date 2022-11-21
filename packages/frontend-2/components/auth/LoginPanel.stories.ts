import { Meta, Story } from '@storybook/vue3'
import AuthLoginPanel from '~~/components/auth/LoginPanel.vue'
import { loginServerInfoQuery } from '~~/lib/auth/graphql/queries'
import { AuthStrategy } from '~~/lib/auth/helpers/strategies'
import { LoginServerInfoQuery } from '~~/lib/common/generated/gql/graphql'
import { MockedProviderOptions } from '~~/lib/fake-nuxt-env/components/MockedProvider'

export default {
  component: AuthLoginPanel,
  parameters: {
    backgrounds: {
      default: 'foundation-page'
    }
  }
} as Meta

export const Default: Story = {
  render: (args) => ({
    components: { AuthLoginPanel },
    setup() {
      return { args }
    },
    template: `<AuthLoginPanel v-bind="args"/>`
  }),
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: { query: loginServerInfoQuery },
          result: {
            data: {
              serverInfo: {
                __typename: 'ServerInfo',
                authStrategies: [
                  { id: AuthStrategy.Local, name: 'Local', url: '/' },
                  {
                    id: AuthStrategy.Google,
                    name: 'Google',
                    url: 'https://google.com'
                  },
                  {
                    id: AuthStrategy.Github,
                    name: 'Github',
                    url: 'https://github.com'
                  },
                  {
                    id: AuthStrategy.AzureAD,
                    name: 'Azure',
                    url: 'https://microsoft.com'
                  }
                ]
              }
            } as LoginServerInfoQuery
          }
        }
      ]
    } as MockedProviderOptions
  }
}
