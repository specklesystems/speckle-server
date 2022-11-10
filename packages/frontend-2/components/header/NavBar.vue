<template>
  <Disclosure
    v-slot="{ open }"
    as="nav"
    class="bg-foundation shadow-md hover:shadow-lg transition fixed w-full z-10"
  >
    <div class="layout-columns-single">
      <div class="flex h-14 transition-all justify-between">
        <div class="flex">
          <HeaderLogoBlock :active="false" class="mr-1" />
          <div class="hidden sm:flex flex-shrink-0 items-center">
            <HeaderNavLink to="/" name="Dashboard" :separator="false" class="ml-2" />

            <HeaderNavLink
              v-for="nl in nav.filter((n) => !!n)"
              :key="nl.to"
              :to="nl.to"
              :name="nl.name"
              :separator="nl.separator"
            />

            <!-- <HeaderNavLink to="/test" name="Long Project Name" /> -->
            <!-- <code class="text-xs">{{ nav }}</code> -->
          </div>
        </div>
        <div class="hidden sm:ml-6 sm:flex sm:items-center">
          <HeaderThemeToggle />

          <!-- Profile dropdown -->
          <Menu as="div" class="relative ml-4">
            <div>
              <MenuButton
                class="flex rounded-full bg-foundation text-sm ring-offset-foundation focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <span class="sr-only">Open user menu</span>
                <img
                  v-if="activeUserImageUrl"
                  class="h-8 w-8 rounded-full"
                  :src="activeUserImageUrl"
                  alt=""
                />
                <UserCircleIcon v-else class="h-8 w-8 rounded-full text-foreground" />
              </MenuButton>
            </div>
            <Transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <MenuItems
                class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-foundation py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <MenuItem
                  v-for="item in userNavigation"
                  :key="item.name"
                  v-slot="{ active }"
                >
                  <NuxtLink
                    :href="item.href"
                    :class="[
                      active ? 'bg-foundation-2' : '',
                      'block px-4 py-2 text-sm text-foreground cursor-pointer'
                    ]"
                    @click="item.onClick"
                  >
                    {{ item.name }}
                  </NuxtLink>
                </MenuItem>
              </MenuItems>
            </Transition>
          </Menu>
        </div>
        <div class="-mr-2 flex items-center sm:hidden">
          <!-- Mobile menu button -->
          <DisclosureButton
            class="inline-flex items-center justify-center rounded-md bg-foundation p-2 text-foreground-3 hover:bg-foundation-2 hover:text-foreground-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:dark:ring-blue-900 ring-offset-white dark:ring-offset-black focus:ring-offset-2"
          >
            <span class="sr-only">Open main menu</span>
            <Bars3Icon v-if="!open" class="block h-6 w-6" aria-hidden="true" />
            <XMarkIcon v-else class="block h-6 w-6" aria-hidden="true" />
          </DisclosureButton>
        </div>
      </div>
    </div>

    <DisclosurePanel class="sm:hidden" on-pointerleave="">
      <div class="flex flex-col space-y-6 pt-2 pb-6 px-5">
        <HeaderNavLink to="/" name="Dashboard" class="" />
        <HeaderNavLink
          v-for="nl in nav.filter((n) => !!n)"
          :key="nl.to"
          :to="nl.to"
          :name="nl.name"
          :separator="nl.separator"
        />
      </div>
      <div class="border-t border-foundation-2 pt-4 pb-4">
        <div class="flex items-center px-4">
          <div class="flex-shrink-0">
            <img
              v-if="activeUserImageUrl"
              class="h-12 w-12 rounded-full"
              :src="activeUserImageUrl"
              alt=""
            />
            <UserCircleIcon v-else class="h-12 w-12 rounded-full" />
          </div>
          <div class="ml-4">
            <div class="text-base font-medium text-foreground">
              {{ activeUser ? activeUser.name : 'Guest' }}
            </div>
            <div v-if="activeUser" class="text-sm font-medium text-foreground-2">
              {{ activeUser.email }}
            </div>
          </div>
          <HeaderThemeToggle class="ml-auto flex-shrink-0" />
        </div>
        <div class="mt-4 space-y-1">
          <DisclosureButton
            v-for="item in userNavigation"
            :key="item.name"
            as="a"
            :href="item.href"
            class="block px-4 py-2 text-base font-medium text-foreground hover:bg-foundation-2 hover:text-foreground-2"
          >
            {{ item.name }}
          </DisclosureButton>
        </div>
      </div>
    </DisclosurePanel>
  </Disclosure>
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
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/vue/24/solid'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useAuthManager } from '~~/lib/auth/composables/auth'

type UserNavigationLink = {
  name: string
  href?: string
  onClick?: () => void
}

const nav = useNav()

const { logout } = useAuthManager()
const { isLoggedIn, activeUser } = useActiveUser()

const userNavigation = computed((): UserNavigationLink[] => [
  ...(isLoggedIn.value
    ? [
        {
          name: 'Sign out',
          onClick: logout
        }
      ]
    : [
        { name: 'Login', href: '/login' },
        { name: 'Register', href: '/register' }
      ])
])

const activeUserImageUrl = computed(() =>
  activeUser.value ? `https://robohash.org/test.png?size=120x120` : null
)
</script>
