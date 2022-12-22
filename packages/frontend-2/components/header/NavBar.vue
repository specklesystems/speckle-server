<template>
  <div class="h-14">
    <Disclosure
      v-slot="{ open }"
      as="nav"
      class="bg-foundation shadow transition fixed w-full z-10"
    >
      <div class="px-4">
        <div class="flex h-14 transition-all justify-between">
          <div class="flex">
            <HeaderLogoBlock :active="false" class="mr-4" />
            <div class="hidden sm:flex flex-shrink-0 items-center">
              <HeaderNavLink to="/" name="Dashboard" :separator="false"></HeaderNavLink>
              <div id="navigation"></div>
              <ClientOnly>
                <PortalTarget name="navigation"></PortalTarget>
              </ClientOnly>
            </div>
          </div>
          <div class="hidden sm:flex sm:items-center items-center">
            <div class="flex items-center">
              <ClientOnly>
                <PortalTarget name="secondary-actions"></PortalTarget>
                <PortalTarget name="primary-actions"></PortalTarget>
              </ClientOnly>

              <!-- Profile dropdown -->
              <Menu as="div" class="ml-2 flex items-center">
                <MenuButton v-slot="{ open }">
                  <span class="sr-only">Open user menu</span>
                  <UserAvatar v-if="!open" size="lg" :user="activeUser" hover-effect />
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
                        <!-- <UserCircleIcon class="w-5 h-5 mr-2" /> -->
                        <UserAvatar :user="activeUser" size="base" />
                      </NuxtLink>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <NuxtLink
                        :class="[
                          active ? 'bg-foundation-focus' : '',
                          'flex items-center  justify-between px-2 py-3 text-sm text-foreground cursor-pointer transition'
                        ]"
                        @click="onClick"
                      >
                        {{ isDarkTheme ? 'Light Mode' : 'Dark Mode' }}
                        <Icon class="w-5 h-5 mr-2" />
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
                    <MenuItem>
                      <AuthVerificationReminderMenuNotice />
                    </MenuItem>
                    <!-- <MenuItem>
                    <div class="p-2 rounded-md space-y-2">
                      <div
                        class="text-sm bg-warning text-warning-darker px-2 py-2 rounded-md"
                      >
                        Email not verified.
                        <a class="font font-bold">Resend verification email?</a>
                      </div>
                    </div>
                  </MenuItem> -->
                  </MenuItems>
                </Transition>
              </Menu>
            </div>
          </div>
          <div class="-mr-2 flex items-center sm:hidden">
            <!-- Mobile menu button -->
            <DisclosureButton
              class="inline-flex items-center justify-center rounded-md bg-foundation p-2 text-foreground-3 hover:bg-foundation-focus hover:text-foreground-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:dark:ring-blue-900 ring-offset-white dark:ring-offset-black focus:ring-offset-2"
            >
              <span class="sr-only">Open main menu</span>
              <Bars3Icon v-if="!open" class="block h-6 w-6" aria-hidden="true" />
              <XMarkIcon v-else class="block h-6 w-6" aria-hidden="true" />
            </DisclosureButton>
          </div>
        </div>
      </div>

      <DisclosurePanel class="sm:hidden" on-pointerleave="">
        <div class="border-t border-foundation-focus pt-4 pb-4">
          <div class="flex items-center px-4">TODO</div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  </div>
</template>
<script setup lang="ts">
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems
} from '@headlessui/vue'
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/vue/24/solid'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import { loginRoute, registerRoute } from '~~/lib/common/helpers/route'
import { useTheme, AppTheme } from '~~/lib/core/composables/theme'

type UserNavigationLink = {
  name: string
  href?: string
  onClick?: () => void
}

const { logout } = useAuthManager()
const { isLoggedIn, activeUser } = useActiveUser()

const userNavigation = computed((): UserNavigationLink[] => [
  ...(isLoggedIn.value
    ? [
        {
          name: 'My Profile',
          onClick: () => {}
        },
        {
          name: 'Sign out',
          onClick: logout
        }
      ]
    : [
        { name: 'Login', href: loginRoute },
        { name: 'Register', href: registerRoute }
      ])
])

const activeUserImageUrl = computed(() =>
  activeUser.value ? `https://robohash.org/test.png?size=120x120` : null
)

const { isDarkTheme, setTheme } = useTheme()
const Icon = computed(() => (isDarkTheme.value ? SunIcon : MoonIcon))

const onClick = () => {
  if (isDarkTheme.value) {
    setTheme(AppTheme.Light)
  } else {
    setTheme(AppTheme.Dark)
  }
}
</script>
