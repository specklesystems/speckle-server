<template>
  <LayoutDialog
    v-model:open="isOpen"
    v-bind="
      !isNotMobile
        ? { title: selectedMenuItem ? selectedMenuItem.title : 'Settings' }
        : {}
    "
    fullscreen
    :show-back-button="!isNotMobile && !!selectedMenuItem"
    @back="selectedMenuItem = null"
  >
    <div class="w-full h-full flex">
      <LayoutSidebar
        v-if="isNotMobile || !selectedMenuItem"
        class="w-full md:w-56 lg:w-60 md:p-4 md:pt-6 md:bg-foundation-page md:border-r md:border-outline-3"
      >
        <LayoutSidebarMenu>
          <LayoutSidebarMenuGroup title="Account settings">
            <template #title-icon>
              <UserIcon class="h-5 w-5" />
            </template>
            <LayoutSidebarMenuGroupItem
              v-for="(sidebarMenuItem, index) in menuItemConfig.user"
              :key="`sidebarUserItem-${index}`"
              :label="sidebarMenuItem.title"
              :class="{
                'bg-foundation-focus hover:!bg-foundation-focus':
                  selectedMenuItem?.title === sidebarMenuItem.title
              }"
              @click="selectedMenuItem = sidebarMenuItem"
            />
          </LayoutSidebarMenuGroup>
          <LayoutSidebarMenuGroup title="Server settings">
            <template #title-icon>
              <ServerStackIcon class="h-5 w-5" />
            </template>
            <LayoutSidebarMenuGroupItem
              v-for="(sidebarMenuItem, index) in menuItemConfig.server"
              :key="`sidebarServerItem-${index}`"
              :label="sidebarMenuItem.title"
              :class="{
                'bg-foundation-focus hover:!bg-foundation-focus':
                  selectedMenuItem?.title === sidebarMenuItem.title
              }"
              @click="selectedMenuItem = sidebarMenuItem"
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
          <component :is="selectedMenuItem.component" />
        </div>
      </main>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { defineComponent } from 'vue'
import type { LocationQueryValue } from 'vue-router'
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
import { settingsQueries } from '~/lib/common/helpers/route'
import {
  LayoutSidebar,
  LayoutSidebarMenu,
  LayoutSidebarMenuGroup
} from '@speckle/ui-components'

type MenuItem = {
  title: string
  component: ReturnType<typeof defineComponent>
}

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const props = defineProps<{
  open: boolean
  targetMenuItem?: LocationQueryValue
}>()

const route = useRoute()
const router = useRouter()
const breakpoints = useBreakpoints(TailwindBreakpoints)
const isNotMobile = breakpoints.greater('md')

const selectedMenuItem = shallowRef<MenuItem | null>(null)

const menuItemConfig: {
  [key: string]: {
    [key: string]: MenuItem
  }
} = {
  user: {
    [settingsQueries.user.profile]: {
      title: 'Profile',
      component: SettingsUserProfile
    },
    [settingsQueries.user.notifications]: {
      title: 'Notifications',
      component: SettingsUserNotifications
    },
    [settingsQueries.user.developerSettings]: {
      title: 'Developer settings',
      component: SettingsUserDeveloper
    }
  },
  server: {
    [settingsQueries.server.general]: {
      title: 'General',
      component: SettingsServerGeneral
    },
    [settingsQueries.server.projects]: {
      title: 'Projects',
      component: SettingsServerProjects
    },
    [settingsQueries.server.activeUsers]: {
      title: 'Active users',
      component: SettingsServerActiveUsers
    },
    [settingsQueries.server.pendingInvitations]: {
      title: 'Pending invitations',
      component: SettingsServerPendingInvitations
    }
  }
}

const isOpen = computed({
  get: () => props.open,
  set: (newVal: boolean) => emit('update:open', newVal)
})

// Check if there is a matching menu item in the config
const getMenuItem = (key: LocationQueryValue): MenuItem | null => {
  const categories = [menuItemConfig.user, menuItemConfig.server]
  for (const category of categories) {
    if (key && key in category) {
      return category[key]
    }
  }

  return null
}

watch(
  isOpen,
  (newVal, oldVal) => {
    if (newVal && !oldVal) {
      const settingsQuery: LocationQueryValue | LocationQueryValue[] =
        route.query?.settings

      // Check if there is a settings query
      if (settingsQuery && typeof settingsQuery === 'string') {
        const matchingMenuItem = getMenuItem(settingsQuery)
        // Set matching menu items if it exists
        if (matchingMenuItem) {
          selectedMenuItem.value = matchingMenuItem
        } else if (isNotMobile.value) {
          // On desktop: if no matching query check if we can match it to server
          // Else open on the user profile page
          // On mobile we not select any item and show the sidebar
          selectedMenuItem.value = settingsQuery.includes('server')
            ? menuItemConfig.server[settingsQueries.server.general]
            : menuItemConfig.user[settingsQueries.user.profile]
        }

        deleteSettingsQuery()
        return
      }

      // Check if there is target prop, only on desktop toggle that page
      if (isNotMobile.value && props.targetMenuItem) {
        const matchingMenuItem = getMenuItem(props.targetMenuItem)
        selectedMenuItem.value = matchingMenuItem
      }
    } else if (!newVal && oldVal) {
      selectedMenuItem.value = null
    }
  },
  { immediate: true }
)

const deleteSettingsQuery = (): void => {
  const currentQueryParams = { ...route.query }
  delete currentQueryParams.settings
  router.push({ query: currentQueryParams })
}
</script>
