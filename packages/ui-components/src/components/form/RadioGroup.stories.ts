import type { Meta, StoryObj } from '@storybook/vue3'
import RadioGroup from './RadioGroup.vue'
import { ChartBarIcon, WrenchIcon, WalletIcon } from '@heroicons/vue/24/outline'
import type { ConcreteComponent } from 'vue'

type RadioGroupStoryType = StoryObj<{
  'update:modelValue'?: (val: string) => void
  modelValue: string
  options: Array<{
    value: string
    title: string
    introduction: string
    icon: ConcreteComponent
    help?: string
  }>
}>

export default {
  component: RadioGroup,
  argTypes: {
    'update:modelValue': {
      action: 'update:modelValue',
      type: 'function'
    }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A customizable radio group component with titles, icons, and introductions for each option.'
      }
    }
  }
} as Meta

export const Default: RadioGroupStoryType = {
  render: (args) => ({
    components: { RadioGroup },
    setup() {
      return { args }
    },
    template: `
      <div>
        <RadioGroup v-bind="args" @update:modelValue="args['update:modelValue']" />
      </div>
    `
  }),
  args: {
    modelValue: 'option1',
    options: [
      {
        value: 'option1',
        title: 'Option 1',
        introduction: 'Introduction for Option 1',
        icon: ChartBarIcon
      },
      {
        value: 'option2',
        title: 'Option 2',
        introduction: 'Introduction for Option 2',
        icon: WalletIcon
      },
      {
        value: 'option3',
        title: 'Option 3',
        introduction: 'Introduction for Option 3',
        icon: WrenchIcon,
        help: 'This is an example helper'
      }
    ]
  }
}
