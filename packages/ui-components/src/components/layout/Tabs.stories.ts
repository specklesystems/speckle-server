import { Meta, StoryObj } from '@storybook/vue3'
import LayoutTabs from '~~/src/components/layout/Tabs.vue'
import { LayoutTabItem } from '~~/src/helpers/layout/components'

export default {
  component: LayoutTabs,
  parameters: {
    docs: {
      description: {
        component: 'Standard tabs component'
      }
    }
  }
} as Meta

const defaultItems: LayoutTabItem[] = [
  { title: 'First tab', id: 'first' },
  { title: 'Second tab', id: 'second' }
]

export const Default: StoryObj = {
  render: (args) => ({
    components: { LayoutTabs },
    setup() {
      return { args }
    },
    template: `
    <div>
      <LayoutTabs v-slot="{ activeItem }" v-bind="args">
        <div>Title: {{ activeItem.title }}</div>
        <div>ID: {{ activeItem.id }}</div>
      </LayoutTabs>
    </div>`
  }),
  args: {
    items: defaultItems
  }
}
