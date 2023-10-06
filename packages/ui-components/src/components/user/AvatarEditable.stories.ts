import { Meta, StoryObj } from '@storybook/vue3'
import UserAvatarEditable from '~~/src/components/user/AvatarEditable.vue'
import { action } from '@storybook/addon-actions'
import { Nullable } from '@speckle/shared'
import { AvatarUser } from '~~/src/composables/user/avatar'

type StoryType = StoryObj<
  Record<string, unknown> & {
    user: AvatarUser
  }
>

export default {
  component: { UserAvatarEditable }
} as Meta

export const Default: StoryType = {
  render: (args, ctx) => ({
    components: { UserAvatarEditable },
    setup: () => ({
      args,
      onSave: (newUrl: Nullable<string>) => {
        action('save')(newUrl)
        ctx.updateArgs({
          ...args,
          user: {
            ...args.user,
            avatar: newUrl
          }
        })
      }
    }),
    template: `
      <UserAvatarEditable v-bind="args" @save="onSave"/>
    `
  }),
  args: {
    user: {
      name: 'John Doe',
      avatar: null
    }
  }
}
