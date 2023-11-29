import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import RadioGroup from '~~/src/components/form/RadioGroup.vue'
import { MegaphoneIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/solid'

export default {
  component: RadioGroup,
  parameters: {
    docs: {
      description: {
        component: 'Custom Stacked Card Radio Group'
      }
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { RadioGroup },
    setup() {
      const selectedOption = ref(null)

      return { args, selectedOption }
    },
    template: `
      <div>
        <RadioGroup v-bind="args" @update:selected="selectedOption = $event" />
      </div>`
  }),
  args: {
    label: 'Example Label:',
    options: [
      {
        title: 'Option 1 Title',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
      },
      {
        title: 'Option 2 Title',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
      }
    ]
  }
}

export const WithIcons: StoryObj = {
  ...Default,
  args: {
    options: [
      {
        title: 'Option 1 Title',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        icon: MagnifyingGlassIcon
      },
      {
        title: 'Option 2 Title',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        icon: MegaphoneIcon
      }
    ]
  }
}
