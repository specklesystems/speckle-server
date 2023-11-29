import type { Meta, StoryObj } from '@storybook/vue3'
import CommonLoadingBar from '~~/src/components/common/loading/Bar.vue'

export default {
  component: CommonLoadingBar,
  parameters: {
    docs: {
      description: {
        component: 'Standard loading bar component'
      }
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { CommonLoadingBar },
    setup: () => ({ args }),
    template: `<CommonLoadingBar v-bind="args"/>`
  }),
  args: {
    loading: true
  }
}
