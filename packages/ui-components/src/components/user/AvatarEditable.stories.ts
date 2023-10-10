import { Meta, StoryObj } from '@storybook/vue3'
import UserAvatarEditable from '~~/src/components/user/AvatarEditable.vue'
import { Nullable } from '@speckle/shared'
import FormButton from '~~/src/components/form/Button.vue'

type StoryType = StoryObj<
  Record<string, unknown> & {
    modelValue: Nullable<string>
    editMode?: boolean
  }
>

export default {
  component: { UserAvatarEditable },
  argTypes: {
    'update:modelValue': {
      action: 'update:modelValue',
      type: 'function'
    },
    save: {
      action: 'save',
      type: 'function'
    },
    modelValue: {
      type: 'string'
    }
  }
} as Meta

export const Default: StoryType = {
  render: (args, ctx) => ({
    components: { UserAvatarEditable },
    setup: () => ({
      args,
      onUpdateModelValue: (newUrl: Nullable<string>) => {
        ctx.updateArgs({
          ...args,
          modelValue: newUrl
        })
      },
      onUpdateEditMode: (newVal: boolean) => {
        ctx.updateArgs({ ...args, editMode: newVal })
      }
    }),
    template: `
      <UserAvatarEditable v-bind="args" @update:modelValue="onUpdateModelValue" @update:editMode="onUpdateEditMode" @update:modelValue="args['update:modelValue']" @save="args['save']"/>
    `
  }),
  args: {
    modelValue: null,
    placeholder: 'John Doe',
    name: 'default',
    editMode: false,
    disabled: false
  }
}

export const WithValidation: StoryType = {
  ...Default,
  render: (args, ctx) => ({
    components: { UserAvatarEditable, FormButton },
    setup: () => ({
      args,
      onUpdateModelValue: (newUrl: Nullable<string>) => {
        ctx.updateArgs({
          ...args,
          modelValue: newUrl
        })
      },
      onUpdateEditMode: (newVal: boolean) => {
        ctx.updateArgs({ ...args, editMode: newVal })
      }
    }),
    template: `
      <form class="flex flex-col space-y-4">
        <UserAvatarEditable v-bind="args" @update:modelValue="onUpdateModelValue" @update:editMode="onUpdateEditMode" @update:modelValue="args['update:modelValue']" @save="args['save']"/>
      </form>
    `
  }),
  args: {
    ...Default.args,
    name: 'with-validation',
    rules: (val: Nullable<string>) =>
      (val || '').length > 0 || 'Please choose a picture',
    validateOnMount: true,
    validateOnValueUpdate: true
  }
}

export const Disabled: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    name: 'disabled',
    disabled: true
  }
}
