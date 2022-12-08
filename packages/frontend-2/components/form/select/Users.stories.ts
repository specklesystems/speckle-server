import { Meta, Story } from '@storybook/vue3'
import FormSelectUsers from '~~/components/form/select/Users.vue'
import { FormUsersSelectItemFragment } from '~~/lib/common/generated/gql/graphql'

const fakeUsers: FormUsersSelectItemFragment[] = [
  {
    id: '1',
    name: 'Rocky Balboa',
    avatar: null
  },
  {
    id: '2',
    name: 'Bozo the Clown',
    avatar: null
  },
  {
    id: '3',
    name: 'Some jabroni',
    avatar: null
  },
  {
    id: '4',
    name: 'Miss America 1987',
    avatar: null
  },
  {
    id: '5',
    name: 'Brad Pitt',
    avatar: null
  },
  {
    id: '6',
    name: 'Kevin McCallister',
    avatar: null
  },
  {
    id: '7',
    name: 'Rickety Cricket',
    avatar: null
  },
  {
    id: '8',
    name: 'Master Chief',
    avatar: null
  }
]

export default {
  component: FormSelectUsers,
  argTypes: {
    'update:modelValue': {
      action: 'update:modelValue',
      type: 'function'
    },
    'nothing-selected': {
      type: 'string',
      description:
        'When nothing has been selected, you can use the slot to render the contents'
    }
  }
} as Meta

export const Default: Story = {
  render: (args, ctx) => ({
    components: { FormSelectUsers },
    setup: () => {
      const selectedUser = ref(undefined)
      return { args, selectedUser }
    },
    template: `
    <FormSelectUsers v-bind="args" @update:modelValue="onModelUpdate">
      <template #nothing-selected>{{ args['nothing-selected'] }}</template>
    </FormSelectUsers>
    `,
    methods: {
      onModelUpdate(val: FormUsersSelectItemFragment) {
        args['update:modelValue'](val)
        ctx.updateArgs({ ...args, modelValue: val })
      }
    }
  }),
  args: {
    multiple: false,
    users: fakeUsers,
    modelValue: undefined,
    'nothing-selected': 'Choose a user'
  }
}

export const Multiple: Story = {
  ...Default,
  args: {
    ...Default.args,
    multiple: true,
    'nothing-selected': 'Choose multiple users'
  }
}
