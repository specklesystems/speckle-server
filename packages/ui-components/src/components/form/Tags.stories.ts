import { Meta, StoryObj } from '@storybook/vue3'
import FormSelectTags from '~~/src/components/form/Tags.vue'

type StoryType = StoryObj<
  Record<string, unknown> & {
    'update:modelValue': (val: unknown) => void
  }
>

export default {
  component: FormSelectTags,
  argTypes: {
    size: {
      options: ['sm', 'base', 'lg', 'xl'],
      control: { type: 'select' }
    },
    color: {
      options: ['page', 'foundation'],
      control: { type: 'select' }
    },
    'update:modelValue': {
      type: 'function',
      action: 'v-model'
    }
  }
} as Meta

export const Default: StoryType = {
  render: (args, ctx) => ({
    components: { FormSelectTags },
    setup: () => {
      return { args }
    },
    template: `
    <div class="bg-foundation p-5 w-full">
      <FormSelectTags v-bind="args" @update:modelValue="onModelUpdate"/>
    </div>
    `,
    methods: {
      onModelUpdate(val: unknown) {
        args['update:modelValue'](val)
        ctx.updateArgs({ ...args, modelValue: val })
      }
    }
  }),
  args: {
    name: 'default',
    help: 'Some help text',
    label: 'Tags',
    showLabel: true,
    rules: undefined,
    validateOnMount: false,
    validateOnValueUpdate: false,
    modelValue: [],
    autoFocus: true,
    showClear: false,
    showRequired: true,
    color: 'page',
    fullWidth: false,
    wrapperClasses: undefined,
    size: 'base',
    placeholder: 'Choose some tags',
    disabled: false
  }
}

export const Disabled = {
  ...Default,
  args: {
    ...Default.args,
    name: 'disabled',
    disabled: true,
    modelValue: ['tag1', 'tag2']
  }
}

export const Required = {
  ...Default,
  args: {
    ...Default.args,
    name: 'required',
    showRequired: true,
    rules: [(tags: string[]) => (tags.length ? true : 'Value needs at least 1 tag')],
    validateOnMount: true,
    validateOnValueUpdate: true
  }
}

export const WithClear = {
  ...Default,
  args: {
    ...Default.args,
    name: 'with-clear',
    showClear: true
  }
}

export const WithClearAndError = {
  ...Default,
  args: {
    ...Default.args,
    name: 'with-clear-and-error',
    showRequired: true,
    rules: [() => 'Value will always be invalid'],
    validateOnMount: true,
    showClear: true
  }
}

export const WithFoundationColor: StoryType = {
  ...Default,
  render: (args, ctx) => ({
    components: { FormSelectTags },
    setup: () => {
      return { args }
    },
    template: `
    <div class="bg-foundation-page p-5 w-full">
      <FormSelectTags v-bind="args" @update:modelValue="onModelUpdate"/>
    </div>
    `,
    methods: {
      onModelUpdate(val: unknown) {
        args['update:modelValue'](val)
        ctx.updateArgs({ ...args, modelValue: val })
      }
    }
  }),
  args: {
    ...Default.args,
    name: 'with-foundation-color',
    color: 'foundation'
  }
}
