import { FaceSmileIcon } from '@heroicons/vue/24/outline'
import type { Meta, StoryObj } from '@storybook/vue3'
import LayoutDisclosure from '~~/src/components/layout/Disclosure.vue'

export default {
  component: LayoutDisclosure,
  parameters: {
    docs: {
      description: {
        component: 'Standard disclosure panel'
      }
    }
  },
  argTypes: {
    color: {
      options: ['default', 'danger'],
      control: { type: 'select' }
    },
    icon: {
      type: 'function'
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { LayoutDisclosure },
    setup() {
      return { args }
    },
    template: `
    <div>
      <LayoutDisclosure v-bind="args">
        <div class="flex flex-col text-foreground space-y-4">
          <div class="h4 font-semibold">Hello world!</div>
          <div>Lorem ipsum blah blah blah</div>
        </div>
      </LayoutDisclosure>
    </div>`
  }),
  args: {
    title: 'Disclosure title',
    color: 'default',
    icon: FaceSmileIcon
  }
}

export const Danger: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    color: 'danger'
  }
}

export const Success: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    color: 'success'
  }
}

export const Warning: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    color: 'warning'
  }
}
