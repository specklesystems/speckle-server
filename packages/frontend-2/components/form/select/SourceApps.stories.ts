import { Meta, Story } from '@storybook/vue3'
import FormSelectSourceApps from '~~/components/form/select/SourceApps.vue'

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

export const Default: Story = {
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

export const Multiple: Story = {
  ...Default,
  args: {
    ...Default.args,
    multiple: true
  }
}

export const WithSearch: Story = {
  ...Default,
  args: {
    ...Default.args,
    search: true
  }
}
