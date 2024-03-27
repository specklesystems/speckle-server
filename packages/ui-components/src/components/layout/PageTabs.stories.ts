import type { Meta, StoryObj } from '@storybook/vue3'
import LayoutPageTabs from '~~/src/components/layout/PageTabs.vue'
import type { LayoutPageTabItem } from '~~/src/helpers/layout/components'
import { useStorybookVmodel } from '~~/src/composables/testing'

const items: LayoutPageTabItem[] = [
  { title: 'Models', id: 'models', count: 300 },
  { title: 'Discussions', id: 'discussions' },
  { title: 'Automations', id: 'automations', tag: 'New' },
  { title: 'Settings', id: 'settings' }
]

export default {
  component: LayoutPageTabs,
  parameters: {
    docs: {
      description: {
        component: 'Page tabs component'
      }
    }
  },
  argTypes: {
    items: {
      description: 'Array of items to display in the tab'
    },
    title: {
      description: 'Title of the tab'
    },
    vertical: {
      description: 'Whether to display the tabs vertically'
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
    components: { LayoutPageTabs },
    setup() {
      const { model } = useStorybookVmodel({ args, prop: 'activeItem', ctx })
      return { args, model }
    },
    template: `
    <div>
      <LayoutPageTabs v-slot="{ activeItem }" v-bind="args" v-model:activeItem="model">
        <div>Title: {{ activeItem?.title }}</div>
        <div>ID: {{ activeItem?.id }}</div>
      </LayoutPageTabs>
    </div>`
  }),
  args: {
    items,
    title: 'Settings',
    activeItem: items[0]
  }
}

export const Vertical: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    vertical: true
  }
}

export const WithActiveItemModel: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    activeItem: items[2]
  }
}

export const WithActiveItemModelBlocked: StoryObj = {
  ...WithActiveItemModel,
  render: (args, ctx) => ({
    components: { LayoutPageTabs },
    setup() {
      const { model } = useStorybookVmodel({
        args,
        prop: 'activeItem',
        ctx,
        blockChanges: true
      })
      return { args, model }
    },
    template: `
    <div>
      <LayoutPageTabs v-slot="{ activeItem }" v-bind="args" v-model:activeItem="model">
        <div>Title: {{ activeItem?.title }}</div>
        <div>ID: {{ activeItem?.id }}</div>
      </LayoutPageTabs>
    </div>`
  })
}
