import { Meta } from '@storybook/vue3'
import Homepage from '~~/pages/index.vue'
import { mockProjectsDashboardPageQuery } from '~~/lib/projects/mocks/projectsPage'
import { buildPageStory } from '~~/lib/common/helpers/storybook'

export default {
  title: 'Pages/Dashboard',
  component: Homepage,
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

export const Default = buildPageStory({
  page: Homepage,
  story: {
    parameters: {
      apolloClient: {
        mocks: [mockProjectsDashboardPageQuery()]
      }
    }
  }
})
