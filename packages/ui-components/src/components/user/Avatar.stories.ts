import type { Meta, StoryObj } from '@storybook/vue3'
import UserAvatar from '~~/src/components/user/Avatar.vue'
import { unhappyCatBase64 } from '~~/src/stories/helpers/avatar'

const sizes = ['xs', 'sm', 'base', 'lg', 'xl', 'editable']

export default {
  component: UserAvatar,
  argTypes: {
    size: {
      options: sizes,
      control: { type: 'select' }
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { UserAvatar },
    setup: () => ({ args }),
    template: `
      <div>
        <UserAvatar v-bind="args"/>
      </div>
    `
  }),
  args: {
    user: {
      name: 'John Doe',
      avatar: unhappyCatBase64
    },
    size: 'base',
    hoverEffect: false,
    active: false,
    noBorder: false,
    noBg: false
  }
}

export const NoAvatar = {
  ...Default,
  args: {
    ...Default.args,
    user: {
      name: 'John Doe',
      avatar: null
    }
  }
}

export const NoUser = {
  ...NoAvatar,
  args: {
    ...NoAvatar.args,
    user: null
  }
}

export const AllSizes: StoryObj = {
  render: (args) => ({
    components: { UserAvatar },
    setup: () => ({ args, sizes }),
    template: `
      <div class="flex flex-col space-y-2">
        <div v-for="size in sizes" :key="size">
          <UserAvatar v-bind="{ ...args, size }"/>
        </div>
      </div>
    `
  }),
  args: {
    ...NoAvatar.args
  }
}
