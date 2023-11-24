import type { Meta, StoryObj } from '@storybook/vue3'
import LayoutGridListToggle from '~~/src/components/layout/GridListToggle.vue'
import { GridListToggleValue } from '~~/src/lib'

type StoryType = StoryObj<
  Record<string, unknown> & {
    'update:modelValue': (val: boolean) => void
  }
>

export default {
  component: LayoutGridListToggle,
  parameters: {
    docs: {
      description: {
        component: 'A button for toggling between grid or list view'
      }
    }
  },
  argTypes: {
    'update:modelValue': {
      type: 'function',
      action: 'v-model'
    },
    modelValue: {
      options: Object.values(GridListToggleValue),
      control: { type: 'select' }
    }
  }
} as Meta

export const Default: StoryType = {
  render: (args, ctx) => ({
    components: { LayoutGridListToggle },
    setup() {
      return { args }
    },
    template: `
    <div>
      <LayoutGridListToggle v-bind="args" @update:modelValue="onModelUpdate"/>
    </div>`,
    methods: {
      onModelUpdate(val: boolean) {
        args['update:modelValue'](val)
        ctx.updateArgs({ ...args, modelValue: val })
      }
    }
  }),
  args: {
    modelValue: GridListToggleValue.Grid
  }
}
