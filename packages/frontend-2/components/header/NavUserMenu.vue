<template>
  <div>
    <Menu as="div" class="flex items-center">
      <MenuButton v-slot="{ open: userOpen }">
        <span class="sr-only">Open user menu</span>
        <UserAvatar v-if="!userOpen" size="lg" :user="activeUser" hover-effect />
        <UserAvatar v-else size="lg" hover-effect>
          <XMarkIcon class="w-5 h-5" />
        </UserAvatar>
      </MenuButton>
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <MenuItems
          class="absolute right-4 top-14 w-56 origin-top-right bg-foundation outline outline-2 outline-primary-muted rounded-md shadow-lg overflow-hidden"
        >
          <MenuItem v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex gap-3 border-b border-primary items-center px-3 py-3 text-sm text-primary cursor-pointer transition mb-1'
              ]"
              @click="goToConnectors()"
            >
              <CloudArrowDownIcon class="w-5 h-5" />
              Connector Downloads
            </NuxtLink>
          </MenuItem>
          <MenuItem v-if="activeUser" v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex gap-2.5 items-center px-3 py-2.5 text-sm text-foreground cursor-pointer transition mx-1 rounded'
              ]"
              @click="() => (showProfileEditDialog = true)"
            >
              <UserAvatar :user="activeUser" size="sm" class="-ml-0.5 mr-px" />
              Edit Profile
            </NuxtLink>
          </MenuItem>
          <MenuItem v-if="isAdmin" v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex gap-3.5 items-center px-3 py-2.5 text-sm text-foreground cursor-pointer transition mx-1 rounded'
              ]"
              @click="goToServerManagement()"
            >
              <Cog6ToothIcon class="w-5 h-5" />
              Server Management
            </NuxtLink>
          </MenuItem>
          <MenuItem v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex gap-3.5 items-center px-3 py-2.5 text-sm text-foreground cursor-pointer transition mx-1 rounded'
              ]"
              @click="onThemeClick"
            >
              <Icon class="w-5 h-5" />
              {{ isDarkTheme ? 'Light Mode' : 'Dark Mode' }}
            </NuxtLink>
          </MenuItem>
          <MenuItem v-if="activeUser && !isGuest" v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex gap-3.5 items-center px-3 py-2.5 text-sm text-foreground cursor-pointer transition mx-1 rounded'
              ]"
              @click="toggleInviteDialog"
            >
              <EnvelopeIcon class="w-5 h-5" />
              Invite to Speckle
            </NuxtLink>
          </MenuItem>
          <MenuItem v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex gap-3.5 items-center px-3 py-2.5 text-sm text-foreground cursor-pointer transition mx-1 rounded'
              ]"
              target="_blank"
              to="https://docs.google.com/forms/d/e/1FAIpQLSeTOU8i0KwpgBG7ONimsh4YMqvLKZfSRhWEOz4W0MyjQ1lfAQ/viewform"
              external
            >
              <ChatBubbleLeftRightIcon class="w-5 h-5" />
              Feedback
            </NuxtLink>
          </MenuItem>
          <MenuItem v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex gap-3.5 items-center px-3 py-2.5 text-sm text-foreground cursor-pointer transition mx-1 rounded'
              ]"
              target="_blank"
              to="/"
            >
              <ArrowsRightLeftIcon class="w-5 h-5" />
              Go to the old Speckle
            </NuxtLink>
          </MenuItem>
          <MenuItem v-if="activeUser" v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex gap-3.5 items-center px-3 py-2.5 text-sm text-danger cursor-pointer transition mx-1 rounded'
              ]"
              @click="logout"
            >
              <ArrowLeftOnRectangleIcon class="w-5 h-5" />
              Sign Out
            </NuxtLink>
          </MenuItem>
          <MenuItem v-if="!activeUser && loginUrl" v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex gap-3.5 items-center px-3 py-2.5 text-sm text-primary cursor-pointer transition mx-1 rounded'
              ]"
              :to="loginUrl"
            >
              <ArrowRightOnRectangleIcon class="w-5 h-5" />
              Sign In
            </NuxtLink>
          </MenuItem>
          <MenuItem v-if="version">
            <div class="px-2 pl-4 pb-1 text-tiny text-foreground-2">
              Version {{ version }}
            </div>
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
    <ServerManagementInviteDialog v-model:open="showInviteDialog" />
    <UserProfileEditDialog v-model:open="showProfileEditDialog" />
  </div>
</template>
<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import {
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  ArrowsRightLeftIcon,
  SunIcon,
  MoonIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  CloudArrowDownIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/vue/24/outline'
import { Roles } from '@speckle/shared'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import { useTheme, AppTheme } from '~~/lib/core/composables/theme'
import { useServerInfo } from '~/lib/core/composables/server'
import type { RouteLocationRaw } from 'vue-router'
import { homeRoute, profileRoute } from '~/lib/common/helpers/route'

defineProps<{
  loginUrl?: RouteLocationRaw
}>()

const { logout } = useAuthManager()
const { activeUser, isGuest } = useActiveUser()
const { isDarkTheme, setTheme } = useTheme()
const { serverInfo } = useServerInfo()
const router = useRouter()
const route = useRoute()

const showInviteDialog = ref(false)
const showProfileEditDialog = ref(false)

const Icon = computed(() => (isDarkTheme.value ? SunIcon : MoonIcon))
const version = computed(() => serverInfo.value?.version)
const isAdmin = computed(() => activeUser.value?.role === Roles.Server.Admin)
const isProfileRoute = computed(() => route.path === profileRoute)

const toggleInviteDialog = () => {
  showInviteDialog.value = true
}

const onThemeClick = () => {
  if (isDarkTheme.value) {
    setTheme(AppTheme.Light)
  } else {
    setTheme(AppTheme.Dark)
  }
}

const goToConnectors = () => {
  router.push('/downloads')
}

const goToServerManagement = () => {
  router.push('/server-management')
}

watch(
  isProfileRoute,
  (newVal, oldVal) => {
    if (newVal && !oldVal) {
      showProfileEditDialog.value = true
      void router.replace({ path: homeRoute, force: true }) // in-place replace
    }
  },
  { immediate: true }
)
</script>
