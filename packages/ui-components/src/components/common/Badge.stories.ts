import type { Meta, StoryObj } from '@storybook/vue3'
import CommonBadge from '~~/src/components/common/Badge.vue'
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
    },
    clickIcon: {
      action: 'click',
      type: 'function'
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { CommonBadge },
    setup: () => ({ args }),
    template: `<CommonBadge v-bind="args" @click-icon="args.clickIcon">{{ args.default || 'Badge' }}</CommonBadge>`
  }),
  args: {
    size: 'base',
    dot: false,
    rounded: false,
    clickableIcon: false
  }
}

export const Large: StoryObj = {
  ...Default,
  args: {
    size: 'lg'
  }
}

export const Rounded: StoryObj = {
  ...Default,
  args: {
    rounded: true
  }
}

export const WithDot: StoryObj = {
  ...Default,
  args: {
    dot: true
  }
}

export const WithIcon: StoryObj = {
  ...Default,
  args: {
    iconLeft: FaceSmileIcon
  }
}

export const WithClickableIcon: StoryObj = {
  ...Default,
  args: {
    clickableIcon: true,
    iconLeft: XMarkIcon
  }
}

export const WithCustomColors: StoryObj = {
  ...Default,
  args: {
    iconLeft: FaceSmileIcon,
    dot: true,
    colorClasses: 'text-info bg-warning',
    dotIconColorClasses: 'text-success'
  }
}
