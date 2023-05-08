import { Meta, StoryObj } from '@storybook/vue3'
import ProjectPage from '~~/pages/projects/[id]/index.vue'
import {
  mockProjectLatestCommentThreadsQuery,
  mockProjectLatestModelsQuery,
  mockProjectModelChildrenTreeQuery,
  mockProjectModelsTreeTopLevelQuery,
  mockProjectPageQuery
} from '~~/lib/projects/mocks/projectPage'
import { buildPageStory } from '~~/lib/common/helpers/storybook'

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

const baseStory = buildPageStory({
  page: ProjectPage,
  story: {
    parameters: {
      vueRouter: {
        route: { params: { id: fakeProjectId }, query: {} }
      }
    }
  }
})

export const Default: StoryObj = {
  ...baseStory,
  parameters: {
    ...baseStory.parameters,
    apolloClient: {
      mocks: [
        ...(baseStory.parameters?.apolloClient?.mocks || []),
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
    }
  }
}

export const EmptyState: StoryObj = {
  ...Default,
  parameters: {
    ...Default.parameters,
    apolloClient: {
      mocks: [
        ...(baseStory.parameters?.apolloClient?.mocks || []),
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
    }
  }
}
