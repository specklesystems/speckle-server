import type { Meta, StoryObj } from '@storybook/vue3'
import CommonProgressBar from '~~/src/components/common/ProgressBar.vue'

export default {
  component: CommonProgressBar,
  argTypes: {
    currentValue: Number,
    maxValue: Number,
    size: {
      options: ['base'],
      control: { type: 'select' }
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { CommonProgressBar },
    setup: () => ({ args }),
    template: `<CommonProgressBar v-bind="args" />`
  }),
  args: {
    size: 'base',
    maxValue: 100,
    currentValue: 10
  }
}
