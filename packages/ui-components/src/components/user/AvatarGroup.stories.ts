import type { Meta, StoryObj } from '@storybook/vue3'
import UserAvatarGroup from '~~/src/components/user/AvatarGroup.vue'
import type { AvatarUserWithId } from '~~/src/composables/user/avatar'

const sizes = ['xs', 'sm', 'base', 'lg', 'xl', 'editable']

const fiveUsers: AvatarUserWithId[] = [
  {
    id: '1',
    name: 'John Doe',
    avatar: 'https://placekitten.com/100/100'
  },
  {
    id: '2',
    name: 'Bob Robinson',
    avatar: null
  },
  {
    id: '3',
    name: 'Guy Ritchie',
    avatar: null
  },
  {
    id: '4',
    name: 'Master Chief',
    avatar: null
  },
  {
    id: '5',
    name: 'Super Mario',
    avatar: null
  }
]

export default {
  component: UserAvatarGroup,
  argTypes: {
    size: {
      options: sizes,
      control: { type: 'select' }
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { UserAvatarGroup },
    setup: () => ({ args }),
    template: `
      <div>
        <UserAvatarGroup v-bind="args"/>
      </div>
    `
  }),
  args: {
    overlap: true,
    size: 'base',
    maxCount: undefined,
    users: fiveUsers
  }
}

export const WithMaxCount = {
  ...Default,
  args: {
    ...Default.args,
    maxCount: 3
  }
}
