import type { Meta, StoryObj } from '@storybook/vue3'
import CommonLoadingIcon from '~~/src/components/common/loading/Icon.vue'

export default {
  component: CommonLoadingIcon,
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['base', 'sm', 'lg']
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { CommonLoadingIcon },
    setup: () => ({ args }),
    template: '<CommonLoadingIcon v-bind="args" />'
  }),
  args: {
    loading: true,
    size: 'base'
  }
}
