import { Meta, StoryObj } from '@storybook/vue3'
import { StorybookParameters } from '~~/lib/common/helpers/storybook'
import ProjectPage from '~~/pages/projects/[id]/index.vue'
import DefaultLayout from '~~/layouts/default.vue'
import {
  mockProjectLatestCommentThreadsQuery,
  mockProjectLatestModelsQuery,
  mockProjectModelChildrenTreeQuery,
  mockProjectModelsTreeTopLevelQuery,
  mockProjectPageQuery
} from '~~/lib/projects/mocks/projectPage'

const fakeProjectId = 'some-fake-id'

export default {
  title: 'Pages/Project',
  component: ProjectPage,
  parameters: {
    docs: {
      story: {
        inline: false,
        iframeHeight: 1000
      }
    },
    layout: 'fullscreen',
    manualLayout: true
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { ProjectPage, DefaultLayout },
    setup: () => ({ args }),
    template: `<DefaultLayout><ProjectPage v-bind="args"/></DefaultLayout>`
  }),
  parameters: {
    apolloClient: {
      mocks: [
        mockProjectPageQuery({
          commentThreadCount: 20,
          versionCount: 30,
          modelCount: 40
        }),
        mockProjectLatestModelsQuery(),
        mockProjectModelsTreeTopLevelQuery(),
        mockProjectModelChildrenTreeQuery(),
        mockProjectLatestCommentThreadsQuery()
      ]
    },
    vueRouter: {
      route: { params: { id: fakeProjectId }, query: {} }
    }
  } as StorybookParameters
}

export const EmptyState: StoryObj = {
  ...Default,
  parameters: {
    apolloClient: {
      mocks: [
        mockProjectPageQuery(
          {
            versionCount: 0,
            modelCount: 0,
            commentThreadCount: 0
          },
          {
            result: () => ({
              data: {
                project: {
                  name: 'New empty project!'
                }
              }
            })
          }
        ),
        mockProjectLatestModelsQuery({ resultCount: 0 }),
        mockProjectModelsTreeTopLevelQuery({ resultCount: 0 }),
        mockProjectLatestCommentThreadsQuery({ resultCount: 0 })
      ]
    },
    vueRouter: {
      route: { params: { id: fakeProjectId }, query: {} }
    }
  } as StorybookParameters
}
