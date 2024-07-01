import type { Meta, StoryObj } from '@storybook/vue3'
import LayoutSidebar from '~~/src/components/layout/sidebar/Sidebar.vue'
import LayoutSidebarMenu from '~~/src/components/layout/sidebar/menu/Menu.vue'
import LayoutSidebarMenuGroup from '~~/src/components/layout/sidebar/menu/group/Group.vue'
import LayoutSidebarMenuGroupItem from '~~/src/components/layout/sidebar/menu/group/Item.vue'
import { HomeIcon } from '@heroicons/vue/24/outline'

export default {
  component: LayoutSidebar,
  parameters: {
    docs: {
      description: {
        component:
          'This component displays a sidebar with an optional topbar button slot.'
      }
    }
  },
  argTypes: {
    title: {
      description: 'Title of the sidebar, displayed at the top if provided'
    },
    collapsible: {
      description: 'Indicates if the sidebar sections are collapsible',
      type: 'boolean'
    },
    isStatic: {
      description: 'Indicates if the sidebar should always be visible',
      type: 'boolean'
    }
  }
} as Meta

export const Dashboard: StoryObj = {
  render: (args) => ({
    components: {
      LayoutSidebar,
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
              <HomeIcon class="size-5" />
            </template>
            <LayoutSidebarMenuGroupItem label="Group Item with Icon" to="/" >
              <template #icon>
                <HomeIcon class="size-5" />
              </template>
            </LayoutSidebarMenuGroupItem>
            <LayoutSidebarMenuGroupItem label="Group Item with Icon" to="/" >
              <template #icon>
                <HomeIcon class="size-5" />
              </template>
            </LayoutSidebarMenuGroupItem>
            <LayoutSidebarMenuGroupItem label="Group Item with Icon" to="/" >
              <template #icon>
                <HomeIcon class="size-5" />
              </template>
            </LayoutSidebarMenuGroupItem>

            <LayoutSidebarMenuGroupItem label="Group Item with no Icon" to="/" />

            <LayoutSidebarMenuGroupItem label="Group Item with Child" to="/">
              <LayoutSidebarMenuGroupItem label="Group Item child with Child" to="/">
                <LayoutSidebarMenuGroupItem label="Group Item child" to="/">
                  <template #icon>
                    <HomeIcon class="size-5" />
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
      </LayoutSidebar>
    `
  })
}
