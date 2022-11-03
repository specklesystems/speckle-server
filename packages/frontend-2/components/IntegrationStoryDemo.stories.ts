import IntegrationStoryDemo from '~/components/IntegrationStoryDemo.vue'
import { Meta, Story } from '@storybook/vue3'
import { graphql } from '~~/lib/common/generated/gql'
import { getClient } from '~~/lib/fake-nuxt-env/singletons/apollo'

const serverInfoQuery = graphql(`
  query IntegrationStoryDemoServerInfo {
    serverInfo {
      blobSizeLimitBytes
      name
      company
      description
      adminContact
      canonicalUrl
      termsOfService
      inviteOnly
      version
    }
  }
`)

export default {
  component: IntegrationStoryDemo
} as Meta

export const Default: Story = {
  render: (args, { loaded: serverInfo }) => ({
    components: { IntegrationStoryDemo },
    setup() {
      return { args, serverInfo }
    },
    template: `<integration-story-demo v-bind="args" :server-info="serverInfo"/>`
  }),
  loaders: [
    async () => {
      const client = getClient()
      const { data } = await client.query({ query: serverInfoQuery })

      return {
        serverInfo: data
      }
    }
  ]
}
