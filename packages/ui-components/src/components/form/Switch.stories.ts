import type { Meta, StoryObj } from '@storybook/vue3'
import Switch from './Switch.vue'

type SwitchStoryType = StoryObj<
  Record<string, unknown> & {
    'update:modelValue'?: (val: boolean) => void
    modelValue?: boolean
  }
>

export default {
  component: Switch,
  argTypes: {
    'update:modelValue': {
      action: 'update:modelValue',
      type: 'function'
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'A customizable switch component'
      }
    }
  }
} as Meta

export const Default: SwitchStoryType = {
  render: (args, ctx) => ({
    components: { Switch },
    setup() {
      return { args }
    },
    template: `
      <div>
        <Switch 
          v-bind="args" 
          @update:modelValue="onModelUpdate"
        />
      </div>
    `,
    methods: {
      onModelUpdate(value: boolean) {
        args['update:modelValue'] && args['update:modelValue'](value)
        ctx.updateArgs({ ...args, modelValue: value })
      }
    }
  }),
  args: {
    modelValue: false,
    name: 'switch',
    label: 'Example switch',
    disabled: false
  }
}

export const Disabled: SwitchStoryType = {
  ...Default,
  args: {
    ...Default.args,
    disabled: true
  }
}
