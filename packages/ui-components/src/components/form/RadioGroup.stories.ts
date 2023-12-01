import type { Meta, StoryObj } from '@storybook/vue3'
import { ref, watch } from 'vue'
import { action } from '@storybook/addon-actions'
import RadioGroup from '~~/src/components/form/RadioGroup.vue'
import { MegaphoneIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/solid'

interface RadioGroupArgs {
  radioGroupName: string
  options: {
    id: string
    title: string
    description?: string
    icon?: typeof MagnifyingGlassIcon | typeof MegaphoneIcon
  }[]
  modelValue: string
  required?: boolean
  helpText?: string
  showTitle?: boolean
}

export default {
  component: RadioGroup,
  parameters: {
    docs: {
      description: {
        component: 'Custom Stacked Card Radio Group'
      }
    },
    actions: {
      handles: ['update:modelValue RadioGroup']
    }
  }
} as Meta

export const Default: StoryObj<RadioGroupArgs> = {
  render: (args, ctx) => ({
    components: { RadioGroup },
    setup() {
      const selectedOption = ref<string>(args.modelValue)

      watch(selectedOption, (newValue) => {
        args.modelValue = newValue
        action('update:modelValue')(newValue)
        ctx.updateArgs({ modelValue: newValue })
      })

      return { args, selectedOption }
    },
    template: `
      <div>
        <RadioGroup 
          v-model="selectedOption" 
          v-bind="args" 
          @update:modelValue="args.modelValue = $event"
        />
      </div>`
  }),
  args: {
    radioGroupName: 'Example Label:',
    options: [
      {
        id: 'option1',
        title: 'Option 1 Title',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
      },
      {
        id: 'option2',
        title: 'Option 2 Title',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
      }
    ],
    modelValue: 'option1'
  }
}

export const PreselectedOption: StoryObj<RadioGroupArgs> = {
  ...Default,
  args: {
    ...Default.args,
    modelValue: 'option2'
  }
}

export const WithIcons: StoryObj<RadioGroupArgs> = {
  ...Default,
  args: {
    ...Default.args,
    options: [
      {
        id: 'option1',
        title: 'Option 1 Title',
        icon: MagnifyingGlassIcon,
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
      },
      {
        id: 'option2',
        title: 'Option 2 Title',
        icon: MegaphoneIcon,
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
      }
    ]
  }
}

export const WithRequiredBadge: StoryObj<RadioGroupArgs> = {
  ...Default,
  args: {
    ...Default.args,
    required: true,
    radioGroupName: 'Your Title',
    showTitle: true
  }
}

export const WithHelpTextAndTitle: StoryObj<RadioGroupArgs> = {
  ...Default,
  args: {
    ...Default.args,
    helpText: 'Additional information here',
    radioGroupName: 'Your Title',
    showTitle: true
  }
}
