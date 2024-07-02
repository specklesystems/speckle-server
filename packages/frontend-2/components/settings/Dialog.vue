<template>
  <!-- <LayoutDialog v-model:open="isOpen"> -->
  <div
    class="fixed z-40 w-screen h-screen bg-slate-700/40 top-0 left-0 pt-4 md:p-4 md:p-8"
  >
    <div class="bg-white w-full h-full flex bg-slate-700/40 rounded overflow-hidden">
      <ClientOnly>
        <div
          v-if="!isMobile || !selectedItem"
          class="w-full md:w-56 lg:w-60 p-4 pt-6 bg-gray-100 md:border-r md:border-gray-200"
        >
          <LayoutSidebar>
            <LayoutSidebarMenu>
              <LayoutSidebarMenuGroup title="Account Settings">
                <template #title-icon>
                  <UserIcon />
                </template>
                <LayoutSidebarMenuGroupItem
                  label="User Profile"
                  @click="setSelectedItem(itemConfig.profile)"
                />
                <LayoutSidebarMenuGroupItem
                  label="Notifications"
                  @click="setSelectedItem(itemConfig.notifications)"
                />
                <LayoutSidebarMenuGroupItem
                  label="Developer Settings"
                  @click="setSelectedItem(itemConfig.developer)"
                />
              </LayoutSidebarMenuGroup>
              <LayoutSidebarMenuGroup title="Server Settings">
                <template #title-icon>
                  <ServerStackIcon />
                </template>
                <LayoutSidebarMenuGroupItem
                  label="General"
                  @click="setSelectedItem(itemConfig.general)"
                />
                <LayoutSidebarMenuGroupItem
                  label="Projects"
                  @click="setSelectedItem(itemConfig.projects)"
                />
                <LayoutSidebarMenuGroupItem
                  label="Active Users"
                  @click="setSelectedItem(itemConfig.users)"
                />
                <LayoutSidebarMenuGroupItem
                  label="Pending invitation"
                  @click="setSelectedItem(itemConfig.invites)"
                />
              </LayoutSidebarMenuGroup>
            </LayoutSidebarMenu>
          </LayoutSidebar>
        </div>
      </ClientOnly>
      <section
        v-if="selectedItem"
        class="overflow-scroll flex-1 bg-gray-50 p-6 py-8 md:p-4 md:py-12"
      >
        <div class="flex md:hidden items-center">
          <ChevronLeftIcon class="w-6 h-6" @click="clearSelection" />
          <h2 class="h4 font-semibold ml-4">{{ selectedItem.title }}</h2>
        </div>
        <component :is="selectedItem?.component" />
      </section>
    </div>
  </div>
  <!-- </LayoutDialog> -->
</template>

<script setup lang="ts">
import type { defineComponent } from 'vue'
import { ChevronLeftIcon } from '@heroicons/vue/24/solid'
import SettingsUserProfile from './user/Profile'
import SettingsUserNotifications from './user/Notifications'
import SettingsUserDeveloper from './user/Developer'
import SettingsServerGeneral from './server/General'
import SettingsServerProjects from './server/Projects'
import SettingsServerActiveUsers from './server/ActiveUsers'
import SettingsServerInvites from './server/Invites'
import { useBreakpoints } from '@vueuse/core'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import { UserIcon, ServerStackIcon } from '@heroicons/vue/24/outline'
import {
  LayoutSidebar,
  LayoutSidebarMenu,
  LayoutSidebarMenuGroup
} from '@speckle/ui-components'

const breakpoints = useBreakpoints(TailwindBreakpoints)
const isMobile = breakpoints.smallerOrEqual('sm')

type SelectableItem = {
  title: string
  component: ReturnType<typeof defineComponent>
}

const itemConfig: { [key: string]: SelectableItem } = {
  profile: {
    title: 'Profile',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    component: SettingsUserProfile
  },
  notifications: {
    title: 'Notifications',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    component: SettingsUserNotifications
  },
  developer: {
    title: 'Developer Settings',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    component: SettingsUserDeveloper
  },
  general: {
    title: 'General',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    component: SettingsServerGeneral
  },
  projects: {
    title: 'Projects',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    component: SettingsServerProjects
  },
  users: {
    title: 'Active users',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    component: SettingsServerActiveUsers
  },
  invites: {
    title: 'Pending Invitations',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    component: SettingsServerInvites
  }
}

const selectedItem = shallowRef()

function setSelectedItem(item: SelectableItem): void {
  selectedItem.value = item
}

function clearSelection(): void {
  selectedItem.value = null
}
</script>
