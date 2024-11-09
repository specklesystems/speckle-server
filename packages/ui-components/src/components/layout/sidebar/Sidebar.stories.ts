import type { Meta, StoryObj } from '@storybook/vue3'
import LayoutSidebar from '~~/src/components/layout/sidebar/Sidebar.vue'
import LayoutSidebarPromo from '~~/src/components/layout/sidebar/Promo.vue'
import LayoutSidebarMenu from '~~/src/components/layout/sidebar/menu/Menu.vue'
import LayoutSidebarMenuGroup from '~~/src/components/layout/sidebar/menu/group/Group.vue'
import LayoutSidebarMenuGroupItem from '~~/src/components/layout/sidebar/menu/group/Item.vue'
import { HomeIcon } from '@heroicons/vue/24/outline'

export default {
  component: LayoutSidebar,
  parameters: {
    docs: {
      description: {
        component: 'This component displays a sidebar.'
      }
    }
  }
} as Meta

export const Dashboard: StoryObj = {
  render: (args) => ({
    components: {
      LayoutSidebar,
      LayoutSidebarPromo,
      LayoutSidebarMenu,
      LayoutSidebarMenuGroup,
      LayoutSidebarMenuGroupItem,
      HomeIcon
    },
    setup() {
      return {
        args
      }
    },
    template: `
      <LayoutSidebar v-bind="args">
        <LayoutSidebarMenu>
          <LayoutSidebarMenuGroup title="Group Title with Icon">
            <template #title-icon>
              <HomeIcon class="h-5 w-5" />
            </template>
            <LayoutSidebarMenuGroupItem label="Group Item with Icon" tag="Coming soon" disabled />
            <LayoutSidebarMenuGroupItem label="Group Item with Icon" to="/" >
              <template #icon>
                <HomeIcon class="h-5 w-5" />
              </template>
            </LayoutSidebarMenuGroupItem>
            <LayoutSidebarMenuGroupItem label="Group Item with Icon" to="/" >
              <template #icon>
                <HomeIcon class="h-5 w-5" />
              </template>
            </LayoutSidebarMenuGroupItem>
            <LayoutSidebarMenuGroupItem label="Group Item with no Icon" to="/" />
            <LayoutSidebarMenuGroupItem label="Group Item with Child" to="/">
              <LayoutSidebarMenuGroupItem label="Group Item child with Child" to="/">
                <LayoutSidebarMenuGroupItem label="Group Item child" to="/" external>
                  <template #icon>
                    <HomeIcon class="h-5 w-5" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </LayoutSidebarMenuGroupItem>
            </LayoutSidebarMenuGroupItem>
          </LayoutSidebarMenuGroup>
          <LayoutSidebarMenuGroup title="Group Title without icon">
            <LayoutSidebarMenuGroupItem label="Menu item with children" to="/">
              <LayoutSidebarMenuGroupItem label="Menu item" to="/" />
              <LayoutSidebarMenuGroupItem label="Menu item" to="/" />
              <LayoutSidebarMenuGroupItem label="Menu item" to="/" />
              <LayoutSidebarMenuGroupItem label="Menu item" to="/" />
            </LayoutSidebarMenuGroupItem>
          </LayoutSidebarMenuGroup>
        </LayoutSidebarMenu>
        <template #promo>
          <LayoutSidebarPromo title="Example Title" text="An example piece of text" />
        </template>
      </LayoutSidebar>
    `
  })
}
