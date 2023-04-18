import { Meta, StoryObj } from '@storybook/vue3'
import Homepage from '~~/pages/index.vue'
import DefaultLayout from '~~/layouts/default.vue'
import { mockProjectsDashboardPageQuery } from '~~/lib/projects/mocks/projectsPage'
import { mockActiveUserQuery } from '~~/lib/auth/mocks/activeUser'

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

export const Default: StoryObj = {
  render: (args) => ({
    components: { Homepage, DefaultLayout },
    setup: () => ({ args }),
    template: `<DefaultLayout><Homepage v-bind="args"/></DefaultLayout>`
  }),
  parameters: {
    apolloClient: {
      mocks: [mockProjectsDashboardPageQuery(), mockActiveUserQuery()]
    }
  }
}
