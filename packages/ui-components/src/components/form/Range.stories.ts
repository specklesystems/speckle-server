import FormRange from '~~/src/components/form/Range.vue'
import type { StoryObj, Meta } from '@storybook/vue3'

export default {
  component: FormRange,
  argTypes: {
    min: {
      control: { type: 'number' }
    },
    max: {
      control: { type: 'number' }
    },
    step: {
      control: { type: 'number' }
    },
    name: {
      control: { type: 'text' }
    },
    label: {
      control: { type: 'text' }
    },
    modelValue: {
      control: { type: 'number' }
    }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A range slider component for selecting numeric values within a specified range'
      }
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { FormRange },
    setup() {
      return { args }
    },
    template: `<form-range v-bind="args" />`
  }),
  args: {
    name: 'range-input',
    label: 'Select a value',
    min: 0,
    max: 100,
    step: 1,
    modelValue: 50
  },
  parameters: {
    docs: {
      source: {
        code: '<FormRange v-model="value" name="range-input" label="Select a value" :min="0" :max="100" :step="1" />'
      }
    }
  }
}
