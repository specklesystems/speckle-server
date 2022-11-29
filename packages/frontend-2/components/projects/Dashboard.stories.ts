import { Meta, Story } from '@storybook/vue3'
import ProjectsDashboard from '~~/components/projects/Dashboard.vue'
import { ProjectsDashboardQueryQuery } from '~~/lib/common/generated/gql/graphql'
import { MockedProviderOptions } from '~~/lib/fake-nuxt-env/components/MockedProvider'
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
                projects: []
              }
            } as ProjectsDashboardQueryQuery
          }
        }
      ]
    } as MockedProviderOptions
  }
}
