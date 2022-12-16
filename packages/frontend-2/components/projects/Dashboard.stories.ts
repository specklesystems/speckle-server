import { Meta, Story } from '@storybook/vue3'
import ProjectsDashboard from '~~/components/projects/Dashboard.vue'
import { ProjectsDashboardQueryQuery } from '~~/lib/common/generated/gql/graphql'
import { MockedApolloProviderOptions } from '~~/lib/fake-nuxt-env/components/MockedApolloProvider'
import { projectsDashboardQuery } from '~~/lib/projects/graphql/queries'

export default {
  component: ProjectsDashboard
} as Meta

export const EmptyState: Story = {
  render: (args) => ({
    components: { ProjectsDashboard },
    setup: () => ({ args }),
    template: `<ProjectsDashboard v-bind="args"/>`
  }),
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: { query: projectsDashboardQuery },
          result: {
            data: {
              activeUser: {
                id: 'fake',
                projects: {
                  totalCount: 0,
                  items: []
                }
              }
            } as ProjectsDashboardQueryQuery
          }
        }
      ]
    } as MockedApolloProviderOptions
  }
}
