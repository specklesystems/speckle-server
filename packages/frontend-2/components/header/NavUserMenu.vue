<template>
  <div>
    <Menu as="div" class="flex items-center">
      <MenuButton :id="menuButtonId" v-slot="{ open: userOpen }">
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
              target="_blank"
              external
              :href="connectorsPageUrl"
            >
              <CloudArrowDownIcon class="w-5 h-5" />
              Connector downloads
            </NuxtLink>
          </MenuItem>
          <MenuItem v-if="activeUser" v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex gap-3.5 items-center px-3 py-2.5 text-sm text-foreground cursor-pointer transition mx-1 rounded'
              ]"
              @click="toggleSettingsDialog(settingsQueries.user.profile)"
            >
              <UserCircleIcon class="w-5 h-5" />
              Settings
            </NuxtLink>
          </MenuItem>
          <MenuItem v-if="isAdmin" v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex gap-3.5 items-center px-3 py-2.5 text-sm text-foreground cursor-pointer transition mx-1 rounded'
              ]"
              @click="toggleSettingsDialog(settingsQueries.server.general)"
            >
              <ServerStackIcon class="w-5 h-5" />
              Server settings
            </NuxtLink>
          </MenuItem>
          <MenuItem v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex gap-3.5 items-center px-3 py-2.5 text-sm text-foreground cursor-pointer transition mx-1 rounded'
              ]"
              @click="toggleTheme"
            >
              <Icon class="w-5 h-5" />
              {{ isDarkTheme ? 'Light mode' : 'Dark mode' }}
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
          <MenuItem v-if="activeUser" v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex gap-3.5 items-center px-3 py-2.5 text-sm text-danger cursor-pointer transition mx-1 rounded'
              ]"
              @click="logout"
            >
              <ArrowLeftOnRectangleIcon class="w-5 h-5" />
              Sign out
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
              Sign in
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
    <SettingsServerUserInviteDialog v-model:open="showInviteDialog" />
    <SettingsDialog
      v-model:open="showSettingsDialog"
      v-model:target-menu-item="settingsDialogTarget"
    />
  </div>
</template>
<script setup lang="ts">
import { isString } from 'lodash'
import { useBreakpoints } from '@vueuse/core'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import {
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  EnvelopeIcon,
  CloudArrowDownIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ServerStackIcon
} from '@heroicons/vue/24/outline'
import { Roles } from '@speckle/shared'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import { useTheme } from '~~/lib/core/composables/theme'
import { useServerInfo } from '~/lib/core/composables/server'
import { connectorsPageUrl, settingsQueries } from '~/lib/common/helpers/route'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  loginUrl?: RouteLocationRaw
}>()

const route = useRoute()
const { logout } = useAuthManager()
const { activeUser, isGuest } = useActiveUser()
const { isDarkTheme, toggleTheme } = useTheme()
const { serverInfo } = useServerInfo()
const router = useRouter()

const showInviteDialog = ref(false)
const showSettingsDialog = ref(false)
const settingsDialogTarget = ref<string | null>(null)
const menuButtonId = useId()
const breakpoints = useBreakpoints(TailwindBreakpoints)
const isMobile = breakpoints.smaller('md')

const Icon = computed(() => (isDarkTheme.value ? SunIcon : MoonIcon))
const version = computed(() => serverInfo.value?.version)
const isAdmin = computed(() => activeUser.value?.role === Roles.Server.Admin)

const toggleInviteDialog = () => {
  showInviteDialog.value = true
}

const toggleSettingsDialog = (target: string) => {
  showSettingsDialog.value = true

  // On mobile open the modal but dont set the target
  settingsDialogTarget.value = !isMobile.value ? target : null
}

const deleteSettingsQuery = (): void => {
  const currentQueryParams = { ...route.query }
  delete currentQueryParams.settings
  router.push({ query: currentQueryParams })
}

onMounted(() => {
  const settingsQuery = route.query?.settings

  if (settingsQuery && isString(settingsQuery)) {
    showSettingsDialog.value = true
    settingsDialogTarget.value = settingsQuery
    deleteSettingsQuery()
  }
})
</script>
