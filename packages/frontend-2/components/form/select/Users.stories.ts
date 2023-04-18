import { Meta, StoryObj } from '@storybook/vue3'
import FormSelectUsers from '~~/components/form/select/Users.vue'
import { FormUsersSelectItemFragment } from '~~/lib/common/generated/gql/graphql'
import { ApolloMockData } from '~~/lib/common/helpers/storybook'

type StoryType = StoryObj<
  Record<string, unknown> & {
    'update:modelValue': (val: FormUsersSelectItemFragment) => void
  }
>

export const fakeUsers: ApolloMockData<FormUsersSelectItemFragment[]> = [
  {
    __typename: 'LimitedUser',
    id: '1',
    name: 'Rocky Balboa',
    avatar:
      'https://www.gannett-cdn.com/-mm-/ea8a07dc617309ca168e259d006a72abae509118/c=0-35-650-402/local/-/media/2016/02/25/SiouxFalls/SiouxFalls/635919633708862216-rocky.jpg?width=1200&disable=upscale&format=pjpg&auto=webp'
  },
  {
    __typename: 'LimitedUser',
    id: '2',
    name: 'Bozo the Clown',
    avatar:
      'https://cdn.vox-cdn.com/thumbor/Z2b-41HMCuVhqtEAkgor1w5iy-E=/1400x1050/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/10483479/bozo_RIP_getty_ringer.jpg'
  },
  {
    __typename: 'LimitedUser',
    id: '3',
    name: `Some jabroni with a super very long name, I mean look at it, it's way too long for a select box!`,
    avatar: null
  },
  {
    __typename: 'LimitedUser',
    id: '4',
    name: 'Miss America 1987',
    avatar: null
  },
  {
    __typename: 'LimitedUser',
    id: '5',
    name: 'Brad Pitt',
    avatar:
      'https://media1.popsugar-assets.com/files/thumbor/4UYUg9UKWqqhaFfElFDU9bKMRgQ/356x1145:1857x2646/fit-in/500x500/filters:format_auto-!!-:strip_icc-!!-/2019/09/04/970/n/1922398/cc3fa7b15d70381d55bd82.88203803_/i/Brad-Pitt.jpg'
  },
  {
    __typename: 'LimitedUser',
    id: '6',
    name: 'Kevin McCallister',
    avatar:
      'https://m.media-amazon.com/images/M/MV5BZjg2ODUwZTgtODRkMS00N2U1LTg2Y2EtNDVhMjRmMDNkNDk3XkEyXkFqcGdeQWFybm8@._V1_.jpg'
  },
  {
    __typename: 'LimitedUser',
    id: '7',
    name: 'Rickety Cricket',
    avatar: 'https://cdn3.whatculture.com/images/2022/08/4ce6e7d99a9761f6-1200x675.jpg'
  },
  {
    __typename: 'LimitedUser',
    id: '8',
    name: 'Master Chief',
    avatar:
      'https://cdn1.dotesports.com/wp-content/uploads/2021/08/09111246/MasterChief.jpg'
  },
  {
    __typename: 'LimitedUser',
    id: '9',
    name: 'Mario',
    avatar:
      'https://play-lh.googleusercontent.com/5LIMaa7WTNy34bzdFhBETa2MRj7mFJZWb8gCn_uyxQkUvFx_uOFCeQjcK16c6WpBA3E'
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
  },
  excludeStories: ['fakeUsers']
} as Meta

export const Default: StoryType = {
  render: (args, ctx) => ({
    components: { FormSelectUsers },
    setup: () => {
      const selectedUser = ref(undefined)
      return { args, selectedUser }
    },
    template: `
    <div class="flex justify-center h-72">
      <FormSelectUsers v-bind="args" @update:modelValue="onModelUpdate" class="max-w-[217px] w-full"/>
    </div>
    `,
    methods: {
      onModelUpdate(val: FormUsersSelectItemFragment) {
        args['update:modelValue'](val)
        ctx.updateArgs({ ...args, modelValue: val })
      }
    }
  }),
  args: {
    search: false,
    multiple: false,
    users: fakeUsers,
    modelValue: undefined,
    label: 'Choose a user',
    showLabel: false,
    'nothing-selected': undefined
  }
}

export const Multiple: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    multiple: true,
    'nothing-selected': 'Choose multiple users'
  }
}

export const WithSearch: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    search: true
  }
}

export const Disabled: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    disabled: true
  }
}
