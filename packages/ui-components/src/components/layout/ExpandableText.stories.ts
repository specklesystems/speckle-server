import type { Meta, StoryObj } from '@storybook/vue3'
import ExpandableText from './ExpandableText.vue'

export default {
  component: ExpandableText,
  parameters: {
    docs: {
      description: {
        component:
          'An expandable text component. The text will be expanded if it has more than 2 lines.'
      }
    }
  }
} as Meta<typeof ExpandableText>

type Story = StoryObj<typeof ExpandableText>

export const Default: Story = {
  args: {
    title: 'Sample Title',
    text: 'This is sample text with a title above it.'
  }
}

export const LongText: Story = {
  args: {
    title: 'Long Text Example',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisi vel consectetur interdum, nisl nunc egestas nunc, vitae tincidunt nisl nunc euismod nunc. Sed euismod, nisi vel consectetur interdum, nisl nunc egestas nunc.'
  }
}
