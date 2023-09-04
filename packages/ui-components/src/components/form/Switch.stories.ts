import { Meta, StoryObj } from '@storybook/vue3'
import Switch from './Switch.vue'

export default {
  component: Switch,
  parameters: {
    docs: {
      description: {
        component: 'A customizable switch component'
      }
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { Switch },
    setup() {
      return { args }
    },
    template: `
      <div>
        <Switch 
          v-bind="args" 
          :model-value="args.modelValue"
        />
      </div>
    `
  }),
  args: {
    modelValue: false
  }
}
