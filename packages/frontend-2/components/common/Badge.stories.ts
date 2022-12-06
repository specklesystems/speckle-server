import { Meta, Story } from '@storybook/vue3'
import CommonBadge from '~~/components/common/Badge.vue'
import { XMarkIcon } from '@heroicons/vue/20/solid'
import { FaceSmileIcon } from '@heroicons/vue/24/outline'
export default {
  component: CommonBadge,
  argTypes: {
    default: {
      type: 'string',
      description: 'Default slot holds badge text'
    },
    iconLeft: {
      type: 'function'
    },
    size: {
      options: ['base', 'lg'],
      control: { type: 'select' }
    }
  }
} as Meta

export const Default: Story = {
  render: (args) => ({
    components: { CommonBadge },
    setup: () => ({ args }),
    template: `<CommonBadge v-bind="args">{{ args.default || 'Badge' }}</CommonBadge>`
  }),
  args: {
    size: 'base',
    dot: false,
    rounded: false,
    clickableIcon: false
  }
}

export const Large: Story = {
  ...Default,
  args: {
    size: 'lg'
  }
}

export const Rounded: Story = {
  ...Default,
  args: {
    rounded: true
  }
}

export const WithDot: Story = {
  ...Default,
  args: {
    dot: true
  }
}

export const WithIcon: Story = {
  ...Default,
  args: {
    iconLeft: FaceSmileIcon
  }
}

export const WithClickableIcon: Story = {
  ...Default,
  args: {
    clickableIcon: true,
    iconLeft: XMarkIcon
  }
}

export const WithCustomColors: Story = {
  ...Default,
  args: {
    iconLeft: FaceSmileIcon,
    dot: true,
    colorClasses: 'text-info bg-warning',
    dotIconColorClasses: 'text-success'
  }
}
