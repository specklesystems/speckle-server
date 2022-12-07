import { Meta, Story } from '@storybook/vue3'
import { ProjectPageQueryQuery } from '~~/lib/common/generated/gql/graphql'
import { StorybookParameters } from '~~/lib/common/helpers/storybook'
import { projectPageQuery } from '~~/lib/projects/graphql/queries'
import ProjectPage from '~~/pages/projects/[id].vue'
import DefaultLayout from '~~/layouts/default.vue'

const fakeProjectId = 'some-fake-id'

export default {
  title: 'Pages/Project',
  component: ProjectPage,
  parameters: {
    docs: {
      inlineStories: false,
      iframeHeight: 1000
    }
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
                description: 'Test project description'
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
