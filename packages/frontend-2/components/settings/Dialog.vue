<template>
  <LayoutDialog
    v-model:open="isOpen"
    v-bind="
      isMobile ? { title: selectedMenuItem ? selectedMenuItem.title : 'Settings' } : {}
    "
    fullscreen
    :show-back-button="!!(isMobile && selectedMenuItem)"
    @back="onBack"
  >
    <div class="w-full h-full flex">
      <LayoutSidebar
        v-if="!isMobile || !selectedMenuItem"
        class="w-full md:w-56 lg:w-60 md:p-4 md:pt-6 md:bg-foundation-page md:border-r md:border-outline-3"
      >
        <LayoutSidebarMenu>
          <LayoutSidebarMenuGroup title="Account settings">
            <template #title-icon>
              <UserIcon />
            </template>
            <LayoutSidebarMenuGroupItem
              v-for="(sidebarMenuItem, index) in sidebarConfig.user"
              :key="`sidebarUserItem-${index}`"
              :label="sidebarMenuItem.title"
              :class="{
                'bg-foundation-focus hover:!bg-foundation-focus':
                  selectedMenuItem?.path === sidebarMenuItem.path
              }"
              @click="setSelectedMenuItem(sidebarMenuItem)"
            />
          </LayoutSidebarMenuGroup>
          <LayoutSidebarMenuGroup title="Server settings">
            <template #title-icon>
              <ServerStackIcon />
            </template>
            <LayoutSidebarMenuGroupItem
              v-for="(sidebarMenuItem, index) in sidebarConfig.server"
              :key="`sidebarServerItem-${index}`"
              :label="sidebarMenuItem.title"
              :class="{
                'bg-foundation-focus hover:!bg-foundation-focus':
                  selectedMenuItem?.path === sidebarMenuItem.path
              }"
              @click="setSelectedMenuItem(sidebarMenuItem)"
            />
          </LayoutSidebarMenuGroup>
        </LayoutSidebarMenu>
      </LayoutSidebar>
      <main
        v-if="selectedMenuItem"
        :class="[
          'bg-foundation md:p-6 md:px-10 md:py-12 w-full md:bg-foundation',
          !isMobile && 'simple-scrollbar overflow-y-auto flex-1'
        ]"
      >
        <div class="pb-6">
          <component :is="selectedMenuItem?.component" />
        </div>
      </main>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { find, flatMap } from 'lodash-es'
import type { defineComponent } from 'vue'
import SettingsUserProfile from './user/Profile.vue'
import SettingsUserNotifications from './user/Notifications.vue'
import SettingsUserDeveloper from './user/Developer.vue'
import SettingsServerGeneral from './server/General.vue'
import SettingsServerProjects from './server/Projects.vue'
import SettingsServerActiveUsers from './server/ActiveUsers.vue'
import SettingsServerPendingInvitations from './server/PendingInvitations.vue'
import { useBreakpoints } from '@vueuse/core'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import { UserIcon, ServerStackIcon } from '@heroicons/vue/24/outline'
import { settingsRoutes, homeRoute } from '~/lib/common/helpers/route'
import {
  LayoutSidebar,
  LayoutSidebarMenu,
  LayoutSidebarMenuGroup
} from '@speckle/ui-components'

type MenuItem = {
  title: string
  component: ReturnType<typeof defineComponent>
  path: string
}

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const props = defineProps<{
  open: boolean
  route: string
  originalRoute: string
}>()

const router = useRouter()
const breakpoints = useBreakpoints(TailwindBreakpoints)
const isMobile = breakpoints.smallerOrEqual('md')

const selectedMenuItem = shallowRef<MenuItem | null>(null)
const sidebarConfig: { [key: string]: MenuItem[] } = {
  user: [
    {
      title: 'Profile',
      component: SettingsUserProfile,
      path: settingsRoutes.user.profile
    },
    {
      title: 'Notifications',
      component: SettingsUserNotifications,
      path: settingsRoutes.user.notifications
    },
    {
      title: 'Developer settings',
      component: SettingsUserDeveloper,
      path: settingsRoutes.user.developerSettings
    }
  ],
  server: [
    {
      title: 'General',
      component: SettingsServerGeneral,
      path: settingsRoutes.server.general
    },
    {
      title: 'Projects',
      component: SettingsServerProjects,
      path: settingsRoutes.server.projects
    },
    {
      title: 'Active users',
      component: SettingsServerActiveUsers,
      path: settingsRoutes.server.activeUsers
    },
    {
      title: 'Pending invitations',
      component: SettingsServerPendingInvitations,
      path: settingsRoutes.server.pendingInvitations
    }
  ]
}

const isOpen = computed({
  get: () => props.open,
  set: (newVal: boolean) => emit('update:open', newVal)
})

watch(
  isOpen,
  (newVal, oldVal) => {
    if (newVal && !oldVal) {
      if (isMobile.value) {
        history.pushState({}, '', settingsRoutes.default.settings)
      } else {
        const foundItem = find(flatMap(sidebarConfig), { path: props.route })
        if (foundItem) {
          setSelectedMenuItem(foundItem)
        }
      }
    } else if (!newVal && oldVal) {
      router.replace({ path: props.originalRoute ?? homeRoute, force: true })
    }
  },
  { immediate: true }
)

function setSelectedMenuItem(item: MenuItem): void {
  selectedMenuItem.value = item

  if (import.meta.browser) {
    history.pushState({}, '', item.path)
  }
}

function onBack() {
  selectedMenuItem.value = null
  history.pushState({}, '', settingsRoutes.default.settingsh)
}
</script>
