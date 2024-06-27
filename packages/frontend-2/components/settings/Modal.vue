<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div
    class="fixed z-40 w-screen h-screen bg-slate-700/40 top-0 left-0 pt-4 md:p-4 md:p-8"
  >
    <div class="bg-white w-full h-full rounded-md shadow-lg flex overflow-hidden">
      <ClientOnly>
        <div
          v-if="!isMobile || !selectedItem"
          class="w-full md:w-64 h-full bg-gray-100 border-r border-gray-200 flex flex-col"
        >
          <div class="py-4 px-6 md:py-6 flex gap-y-4 flex-col">
            <h1 class="h4 font-semibold py-4 md:hidden">Settings</h1>
            <div>
              <p class="text-sm font-semibold">User settings</p>
            </div>
            <a
              class="text-sm block cursor-pointer"
              :class="{ 'text-blue-600': selectedItem?.title === 'Profile' }"
              @click="setSelectedItem(itemConfig.profile)"
            >
              <p>Account</p>
            </a>
            <a
              class="text-sm block cursor-pointer"
              :class="{ 'text-blue-600': selectedItem?.title === 'Notifications' }"
              @click="setSelectedItem(itemConfig.notifications)"
            >
              <p>Notifications</p>
            </a>
            <div class="mt-4">
              <p class="text-sm font-semibold">Server settings</p>
            </div>
            <a
              class="text-sm block cursor-pointer"
              :class="{ 'text-blue-600': selectedItem?.title === 'General' }"
              @click="setSelectedItem(itemConfig.general)"
            >
              <p>General</p>
            </a>
            <a
              class="text-sm block cursor-pointer"
              :class="{ 'text-blue-600': selectedItem?.title === 'Projects' }"
              @click="setSelectedItem(itemConfig.projects)"
            >
              <p>Projects</p>
            </a>
          </div>
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
</template>
<script setup lang="ts">
import { ChevronLeftIcon } from '@heroicons/vue/24/solid'
import SettingsUserProfile from './user/Profile'
import SettingsUserNotifications from './user/Notifications'
import SettingsServerGeneral from './server/General'
import SettingsServerProjects from './server/Projects'
import { useBreakpoints } from '@vueuse/core'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'

const breakpoints = useBreakpoints(TailwindBreakpoints)
const isMobile = breakpoints.smallerOrEqual('sm')

const itemConfig = {
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
  general: {
    title: 'General',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    component: SettingsServerGeneral
  },
  projects: {
    title: 'Projects',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    component: SettingsServerProjects
  }
}

const selectedItem = shallowRef()

function setSelectedItem(item: string): void {
  selectedItem.value = item
}

function clearSelection(): void {
  selectedItem.value = null
}
</script>
