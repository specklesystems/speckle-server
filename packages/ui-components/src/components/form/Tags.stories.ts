import { wait } from '@speckle/shared'
import type { Meta, StoryObj } from '@storybook/vue3'
import { times } from 'lodash'
import { useForm } from 'vee-validate'
import FormButton from '~~/src/components/form/Button.vue'
import FormSelectTags from '~~/src/components/form/Tags.vue'
import { action } from '@storybook/addon-actions'

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
    },
    getAutocompleteItems: {
      type: 'function'
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
    disabled: false,
    getAutocompleteItems: undefined
  }
}

export const WithAutocomplete = {
  ...Default,
  args: {
    ...Default.args,
    name: 'with-autocomplete',
    getAutocompleteItems: (query: string) =>
      times(20, (i) => `autocomplete-${query}-${i}`)
  }
}

export const WithAsyncAutocomplete = {
  ...Default,
  args: {
    ...Default.args,
    name: 'with-async-autocomplete',
    getAutocompleteItems: async (query: string) => {
      if (!query.length) return []

      await wait(1000)
      return [
        `autocomplete-${query}-1`,
        `autocomplete-${query}-2`,
        `autocomplete-${query}-3`
      ]
    }
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

export const UncontrolledInForm: StoryType = {
  ...Default,
  render: (args) => ({
    components: { FormSelectTags, FormButton },
    setup: () => {
      const { handleSubmit } = useForm()
      const onSubmit = handleSubmit((vals) => {
        action('submit')(vals)
      })
      return { args, onSubmit }
    },
    template: `
    <form class="bg-foundation p-5 w-full flex flex-col space-y-4" @submit="onSubmit">
      <FormSelectTags name="with-form" label="Tags" show-label show-clear/>
      <FormButton submit>Submit</FormButton>
    </form>
    `
  }),
  args: {}
}
