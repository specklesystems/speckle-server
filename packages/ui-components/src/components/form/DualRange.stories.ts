import FormDualRange from '~~/src/components/form/DualRange.vue'
import type { StoryObj, Meta } from '@storybook/vue3'
import { ref } from 'vue'

export default {
  component: FormDualRange,
  argTypes: {
    min: { control: { type: 'number' } },
    max: { control: { type: 'number' } },
    step: { control: { type: 'number' } },
    name: { control: { type: 'text' } },
    disabled: { control: { type: 'boolean' } },
    showFields: { control: { type: 'boolean' } }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A dual-handle range slider component for selecting a numeric range with minimum and maximum values'
      }
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { FormDualRange },
    setup() {
      const rangeValue = ref({ min: 25, max: 75 })
      return { args, rangeValue }
    },
    template: `
      <div class="flex flex-col">
        <FormDualRange 
          v-bind="args" 
          v-model="rangeValue"
        />
        <div class="text-sm text-gray-600">
          Current values: {{ rangeValue.min }} - {{ rangeValue.max }}
        </div>
      </div>
    `
  }),
  args: {
    name: 'dual-range-input',
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    showFields: false
  }
}

export const WithFields: StoryObj = {
  render: (args) => ({
    components: { FormDualRange },
    setup() {
      const rangeValue = ref({ min: 25, max: 75 })
      return { args, rangeValue }
    },
    template: `
      <div class="flex flex-col">
        <FormDualRange 
          v-bind="args" 
          v-model="rangeValue"
        />
        <div class="text-sm text-gray-600 mt-2">
          Current values: {{ rangeValue.min }} - {{ rangeValue.max }}
        </div>
      </div>
    `
  }),
  args: {
    name: 'dual-range-with-fields',
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    showFields: true
  }
}
