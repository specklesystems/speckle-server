import type { Meta, StoryObj } from '@storybook/vue3'
import CommonProgressBar from '~~/src/components/common/loading/ProgressBar.vue'

export default {
  component: CommonProgressBar,
  argTypes: {}
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { CommonProgressBar },
    setup: () => ({ args }),
    template: '<CommonProgressBar v-bind="args" />'
  }),
  args: {
    loading: true,
    progress: 0.2,
    cancelled: false
  }
}
