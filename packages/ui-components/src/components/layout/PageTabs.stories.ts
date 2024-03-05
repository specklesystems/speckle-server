import type { Meta, StoryObj } from '@storybook/vue3'
import LayoutPageTabs from '~~/src/components/layout/PageTabs.vue'
import type { LayoutPageTabItem } from '~~/src/helpers/layout/components'
import {
  CubeIcon,
  Cog6ToothIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/vue/24/outline'

export default {
  component: LayoutPageTabs,
  parameters: {
    docs: {
      description: {
        component: 'Page tabs component'
      }
    }
  }
} as Meta

const items: LayoutPageTabItem[] = [
  { title: 'Models', id: 'models', icon: CubeIcon, count: 300 },
  { title: 'Discussions', id: 'discussions', icon: ChatBubbleLeftRightIcon },
  { title: 'Automations', id: 'automations', icon: BoltIcon, tag: 'New' },
  { title: 'Settings', id: 'settings', icon: Cog6ToothIcon }
]

export const Default: StoryObj = {
  render: (args) => ({
    components: { LayoutPageTabs },
    setup() {
      return { args }
    },
    template: `
    <div>
      <LayoutPageTabs v-slot="{ activeItem }" v-bind="args">
        <div>Title: {{ activeItem.title }}</div>
        <div>ID: {{ activeItem.id }}</div>
      </LayoutPageTabs>
    </div>`
  }),
  args: {
    items,
    title: 'Settings'
  }
}

export const Vertical: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    vertical: true
  }
}
