import type { Meta, StoryObj } from '@storybook/vue3'
import LayoutTabsHorizontal from '~~/src/components/layout/tabs/Horizontal.vue'
import type { LayoutPageTabItem } from '~~/src/helpers/layout/components'
import { useStorybookVmodel } from '~~/src/composables/testing'

const items: LayoutPageTabItem[] = [
  { title: 'Models', id: 'models', count: 300 },
  { title: 'Discussions', id: 'discussions' },
  { title: 'Automations', id: 'automations', tag: 'New' },
  { title: 'Settings', id: 'settings' },
  {
    title: 'Disabled Item',
    id: 'disabled',
    disabled: true,
    disabledMessage: 'Example disabled message'
  }
]

export default {
  component: LayoutTabsHorizontal,
  parameters: {
    docs: {
      description: {
        component:
          'This component displays a set of horizontal tabs, allowing user interaction and selection.'
      }
    }
  },
  argTypes: {
    items: {
      description: 'Array of items to display in the tabs'
    },
    title: {
      description: 'Title of the tabs, displayed above the tabs if provided'
    },
    activeItem: {
      description: 'The active item model. Not required.'
    },
    'update:activeItem': {
      description: 'Event emitted when the active item changes',
      type: 'function',
      action: 'v-model:activeItem'
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args, ctx) => ({
    components: { LayoutTabsHorizontal },
    setup() {
      const { model } = useStorybookVmodel({ args, prop: 'activeItem', ctx })
      return { args, model }
    },
    template: `
    <div>
      <LayoutTabsHorizontal v-slot="{ activeItem }" v-bind="args" v-model:activeItem="model">
        <div>Title: {{ activeItem?.title }}</div>
        <div>ID: {{ activeItem?.id }}</div>
      </LayoutTabsHorizontal>
    </div>`
  }),
  args: {
    items,
    title: 'Tab Example',
    activeItem: items[2]
  }
}
