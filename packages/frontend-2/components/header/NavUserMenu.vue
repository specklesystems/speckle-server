<template>
  <div>
    <Menu as="div" class="ml-2 flex items-center">
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
          class="absolute right-4 top-16 w-64 origin-top-right bg-foundation outline outline-2 outline-primary-muted rounded-md shadow-lg overflow-hidden"
        >
          <MenuItem v-if="activeUser" v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex items-center justify-between px-2 py-3 text-sm text-foreground cursor-pointer transition'
              ]"
            >
              My Profile
              <UserAvatar :user="activeUser" size="sm" class="mr-1" />
            </NuxtLink>
          </MenuItem>
          <MenuItem v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex items-center  justify-between px-2 py-3 text-sm text-foreground cursor-pointer transition'
              ]"
              @click="onThemeClick"
            >
              {{ isDarkTheme ? 'Light Mode' : 'Dark Mode' }}
              <Icon class="w-5 h-5 mr-2" />
            </NuxtLink>
          </MenuItem>
          <MenuItem v-if="activeUser" v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex items-center justify-between px-2 py-3 text-sm text-foreground cursor-pointer transition'
              ]"
              @click="toggleInviteDialog"
            >
              Invite to Speckle
              <EnvelopeIcon class="w-5 h-5 mr-2" />
            </NuxtLink>
          </MenuItem>
          <MenuItem v-if="activeUser" v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex items-center  justify-between px-2 py-3 text-sm text-danger cursor-pointer transition'
              ]"
              @click="logout"
            >
              Sign Out
              <ArrowLeftOnRectangleIcon class="w-5 h-5 mr-2" />
            </NuxtLink>
          </MenuItem>
          <MenuItem v-if="!activeUser" v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex items-center  justify-between px-2 py-3 text-sm text-primary cursor-pointer transition'
              ]"
              :to="loginRoute"
            >
              Sign In
              <ArrowRightOnRectangleIcon class="w-5 h-5 mr-2" />
            </NuxtLink>
          </MenuItem>
          <MenuItem v-if="version">
            <div class="px-2 py-3 text-xs text-foreground-2">Version {{ version }}</div>
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
    <ServerInviteDialog v-model:open="showInviteDialog" />
  </div>
</template>
<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import {
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  EnvelopeIcon
} from '@heroicons/vue/24/solid'
import { useQuery } from '@vue/apollo-composable'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import { loginRoute } from '~~/lib/common/helpers/route'
import { useTheme, AppTheme } from '~~/lib/core/composables/theme'
import { serverVersionInfoQuery } from '~~/lib/core/graphql/queries'

const { logout } = useAuthManager()
const { activeUser } = useActiveUser()
const { isDarkTheme, setTheme } = useTheme()
const { result } = useQuery(serverVersionInfoQuery)

const showInviteDialog = ref(false)

const Icon = computed(() => (isDarkTheme.value ? SunIcon : MoonIcon))
const version = computed(() => result.value?.serverInfo.version)

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
</script>
