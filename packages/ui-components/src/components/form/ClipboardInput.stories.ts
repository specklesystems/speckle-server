import { Meta, StoryObj } from '@storybook/vue3'
import ClipboardInput from './ClipboardInput.vue'

type ClipboardInputStoryType = StoryObj<
  Record<string, unknown> & {
    value?: string
    isMultiline?: boolean
    copiedItemName: string
    showNotificationOnCopy?: boolean
    rows?: number
  }
>

export default {
  component: ClipboardInput,
  parameters: {
    docs: {
      description: {
        component:
          'A clipboard component with copy button and optional notification on copy.'
      }
    }
  }
} as Meta

export const Default: ClipboardInputStoryType = {
  render: (args) => ({
    components: { ClipboardInput },
    setup() {
      return { args }
    },
    template: `
      <div class="bg-white p-8">
        <ClipboardInput 
          v-bind="args" 
        />
      </div>
    `
  }),
  args: {
    value: 'Example content to be copied',
    showCopyButton: true,
    copiedItemName: 'Example item',
    isMultiline: false,
    showNotificationOnCopy: true
  }
}
