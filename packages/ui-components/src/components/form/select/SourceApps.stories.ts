import type { Meta, StoryObj } from '@storybook/vue3'
import FormSelectSourceApps from '~~/src/components/form/select/SourceApps.vue'

type StoryType = StoryObj<
  Record<string, unknown> & {
    'update:modelValue': (val: unknown) => void
  }
>

export default {
  component: FormSelectSourceApps,
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

export const Default: StoryType = {
  render: (args, ctx) => ({
    components: { FormSelectSourceApps },
    setup: () => {
      return { args }
    },
    template: `
    <div class="flex justify-center h-72">
      <FormSelectSourceApps v-bind="args" @update:modelValue="onModelUpdate" class="max-w-[217px] w-full"/>
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
    search: false,
    multiple: false,
    modelValue: undefined,
    label: 'Choose an app',
    showLabel: false,
    'nothing-selected': undefined
  }
}

export const Multiple: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    multiple: true
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
