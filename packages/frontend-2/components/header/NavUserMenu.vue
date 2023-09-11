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
          class="absolute right-0 md:right-4 top-14 md:top-16 w-full md:w-64 origin-top-right bg-foundation outline outline-2 outline-primary-muted rounded-md shadow-lg overflow-hidden"
        >
          <MenuItem v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex items-center justify-between px-2 py-3 text-sm text-primary cursor-pointer transition border-b border-primary'
              ]"
              @click="goToConnectors()"
            >
              Connector Downloads
              <CloudArrowDownIcon class="w-5 h-5 mr-2 text-primary" />
            </NuxtLink>
          </MenuItem>
          <MenuItem v-if="activeUser" v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex items-center justify-between px-2 py-3 text-sm text-foreground cursor-pointer transition'
              ]"
              @click="() => (showProfileEditDialog = true)"
            >
              Edit Profile
              <UserAvatar :user="activeUser" size="sm" class="mr-1" />
            </NuxtLink>
          </MenuItem>
          <MenuItem v-if="isAdmin" v-slot="{ active }">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex items-center  justify-between px-2 py-3 text-sm text-foreground cursor-pointer transition'
              ]"
              to="/server-management"
            >
              Server Management
              <Cog6ToothIcon class="w-5 h-5 mr-2" />
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
          <MenuItem v-if="activeUser && !isGuest" v-slot="{ active }">
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
              :to="loginUrl"
            >
              Sign In
              <ArrowRightOnRectangleIcon class="w-5 h-5 mr-2" />
            </NuxtLink>
          </MenuItem>
          <MenuItem v-if="version">
            <div class="px-2 pb-1 text-tiny text-foreground-2">
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
  SunIcon,
  MoonIcon,
  EnvelopeIcon,
  CloudArrowDownIcon,
  Cog6ToothIcon
} from '@heroicons/vue/24/solid'
import { useQuery } from '@vue/apollo-composable'
import { Optional, Roles } from '@speckle/shared'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import { loginRoute } from '~~/lib/common/helpers/route'
import { useTheme, AppTheme } from '~~/lib/core/composables/theme'
import { serverVersionInfoQuery } from '~~/lib/core/graphql/queries'

const { logout } = useAuthManager()
const { activeUser, isGuest } = useActiveUser()
const { isDarkTheme, setTheme } = useTheme()
const { result } = useQuery(serverVersionInfoQuery)
const route = useRoute()
const router = useRouter()

const showInviteDialog = ref(false)
const showProfileEditDialog = ref(false)
const token = computed(() => route.query.token as Optional<string>)

const Icon = computed(() => (isDarkTheme.value ? SunIcon : MoonIcon))
const version = computed(() => result.value?.serverInfo.version)

const isAdmin = computed(() => activeUser.value?.role === Roles.Server.Admin)

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

const loginUrl = computed(() =>
  router.resolve({
    path: loginRoute,
    query: {
      token: token.value || undefined
    }
  })
)
</script>
