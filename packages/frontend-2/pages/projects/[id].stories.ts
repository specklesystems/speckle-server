import { Meta, Story } from '@storybook/vue3'
import { ProjectPageQueryQuery } from '~~/lib/common/generated/gql/graphql'
import { StorybookParameters } from '~~/lib/common/helpers/storybook'
import { projectPageQuery } from '~~/lib/projects/graphql/queries'
import ProjectPage from '~~/pages/projects/[id].vue'
import DefaultLayout from '~~/layouts/default.vue'
import { fakeUsers } from '~~/components/form/select/Users.stories'

const fakeProjectId = 'some-fake-id'

export default {
  title: 'Pages/Project',
  component: ProjectPage,
  parameters: {
    docs: {
      inlineStories: false,
      iframeHeight: 1000
    },
    layout: 'fullscreen'
  }
} as Meta

export const Default: Story = {
  render: (args) => ({
    components: { ProjectPage, DefaultLayout },
    setup: () => ({ args }),
    template: `<DefaultLayout><ProjectPage v-bind="args"/></DefaultLayout>`
  }),
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: { query: projectPageQuery, variables: { id: fakeProjectId } },
          result: {
            data: {
              project: {
                __typename: 'Project',
                id: fakeProjectId,
                createdAt: new Date().toISOString(),
                name: 'Test project',
                description: 'Test project description',
                versionCount: 10,
                modelCount: 15,
                commentThreadCount: 20,
                team: fakeUsers.slice(3)
              }
            } as ProjectPageQueryQuery
          }
        }
      ]
    },
    vueRouter: {
      route: { params: { id: fakeProjectId } }
    }
  } as StorybookParameters
}
