<template>
  <Disclosure v-slot="{ open }" as="nav" class="bg-background shadow-sm">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 justify-between">
        <div class="flex">
          <div class="flex flex-shrink-0 items-center">
            <HeaderLogoBlock minimal />
          </div>
          <div class="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
            <a
              v-for="item in navigation"
              :key="item.name"
              :href="item.href"
              :class="[
                item.current
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-foreground-3 hover:text-foreground-2 hover:border-foreground-4',
                'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
              ]"
              :aria-current="item.current ? 'page' : undefined"
            >
              {{ item.name }}
            </a>
          </div>
        </div>
        <div class="hidden sm:ml-6 sm:flex sm:items-center">
          <HeaderThemeToggle />

          <!-- Profile dropdown -->
          <Menu as="div" class="relative ml-4">
            <div>
              <MenuButton
                class="flex rounded-full bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <span class="sr-only">Open user menu</span>
                <img
                  v-if="activeUserImageUrl"
                  class="h-8 w-8 rounded-full"
                  :src="activeUserImageUrl"
                  alt=""
                />
                <UserCircleIcon v-else class="h-8 w-8 rounded-full" />
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
                class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-background py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <MenuItem
                  v-for="item in userNavigation"
                  :key="item.name"
                  v-slot="{ active }"
                >
                  <a
                    :href="item.href"
                    :class="[
                      active ? 'bg-background-2' : '',
                      'cursor-pointer block px-4 py-2 text-sm text-foreground-2'
                    ]"
                    @click="item.onClick"
                  >
                    {{ item.name }}
                  </a>
                </MenuItem>
              </MenuItems>
            </Transition>
          </Menu>
        </div>
        <div class="-mr-2 flex items-center sm:hidden">
          <!-- Mobile menu button -->
          <DisclosureButton
            class="inline-flex items-center justify-center rounded-md bg-background p-2 text-foreground-3 hover:bg-background-2 hover:text-foreground-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <span class="sr-only">Open main menu</span>
            <Bars3Icon v-if="!open" class="block h-6 w-6" aria-hidden="true" />
            <XMarkIcon v-else class="block h-6 w-6" aria-hidden="true" />
          </DisclosureButton>
        </div>
      </div>
    </div>

    <DisclosurePanel class="sm:hidden">
      <div class="space-y-1 pt-2 pb-4">
        <DisclosureButton
          v-for="item in navigation"
          :key="item.name"
          as="a"
          :href="item.href"
          :class="[
            item.current
              ? 'bg-background-2 border-primary-lighter text-foreground-2'
              : 'border-transparent text-foreground-3 hover:text-foreground-2 hover:bg-background-2 hover:border-foreground-4',
            'block pl-4 pr-4 py-2 border-l-4 text-base font-medium'
          ]"
          :aria-current="item.current ? 'page' : undefined"
        >
          {{ item.name }}
        </DisclosureButton>
      </div>
      <div class="border-t border-background-3 pt-4 pb-4">
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
            <div v-if="activeUser" class="text-sm font-medium text-foreground-3">
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
            class="cursor-pointer block px-4 py-2 text-base font-medium text-foreground-3 hover:bg-background-2 hover:text-foreground-2"
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
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/vue/24/outline'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useAuthManager } from '~~/lib/auth/composables/auth'

type UserNavigationLink = {
  name: string
  href?: string
  onClick?: () => void
}

const { logout } = useAuthManager()
const { isLoggedIn, activeUser } = useActiveUser()

const navigation = [
  { name: 'Dashboard', href: '#', current: true },
  { name: 'Team', href: '#', current: false },
  { name: 'Projects', href: '#', current: false },
  { name: 'Calendar', href: '#', current: false }
]

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
