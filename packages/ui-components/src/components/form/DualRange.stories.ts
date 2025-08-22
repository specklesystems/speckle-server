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
      const minValue = ref(25)
      const maxValue = ref(75)
      return { args, minValue, maxValue }
    },
    template: `
      <div class="flex flex-col">
        <FormDualRange 
          v-bind="args" 
          v-model:min-value="minValue"
          v-model:max-value="maxValue"
        />
        <div class="text-sm text-gray-600">
          Current values: {{ minValue }} - {{ maxValue }}
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
      const minValue = ref(25)
      const maxValue = ref(75)
      return { args, minValue, maxValue }
    },
    template: `
      <div class="flex flex-col">
        <FormDualRange 
          v-bind="args" 
          v-model:min-value="minValue"
          v-model:max-value="maxValue"
        />
        <div class="text-sm text-gray-600 mt-2">
          Current values: {{ minValue }} - {{ maxValue }}
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
