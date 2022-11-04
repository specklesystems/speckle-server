<template>
  <Disclosure
    v-slot="{ open }"
    as="nav"
    class="group background shadow-md hover:shadow-lg transition fixed w-full"
  >
    <div class="mx-auto px-4">
      <div class="flex h-14 group-hover:h-16 transition-all justify-between">
        <div class="flex">
          <HeaderLogoBlock :active="false" class="mr-1" />
          <div class="hidden sm:flex flex-shrink-0 items-center">
            <HeaderNavLink to="/" name="Dashboard" :separator="false" class="ml-2" />
            <TransitionGroup name="fade">
              <HeaderNavLink
                v-for="(nl, i) in nav.filter((n) => !!n)"
                :key="nl.to"
                :to="nl.to"
                :name="nl.name"
                :separator="nl.separator"
              />
            </TransitionGroup>
            <!-- <HeaderNavLink to="/test" name="Long Project Name" /> -->
            <!-- <code class="text-xs">{{ nav }}</code> -->
          </div>
        </div>
        <div class="hidden sm:ml-6 sm:flex sm:items-center">
          <button
            type="button"
            class="rounded-full bg-background p-1 text-foreground-3 hover:text-foreground-2 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
            @click="swapTheme()"
          >
            <SunIcon v-if="darkMode" class="h-4 w-4" aria-hidden="true" />
            <MoonIcon v-else class="h-4 w-4" aria-hidden="true" />
          </button>

          <!-- Profile dropdown -->
          <Menu as="div" class="relative ml-4">
            <div>
              <MenuButton
                class="flex rounded-full bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <span class="sr-only">Open user menu</span>
                <img class="h-8 w-8 rounded-full" :src="user.imageUrl" alt="" />
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
                      'block px-4 py-2 text-sm text-foreground-2'
                    ]"
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
            class="inline-flex items-center justify-center rounded-md bg-background p-2 text-foreground-3 hover:bg-background-2 hover:text-foreground-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:dark:ring-blue-900 ring-offset-white dark:ring-offset-black focus:ring-offset-2"
          >
            <span class="sr-only">Open main menu</span>
            <Bars3Icon v-if="!open" class="block h-6 w-6" aria-hidden="true" />
            <XMarkIcon v-else class="block h-6 w-6" aria-hidden="true" />
          </DisclosureButton>
        </div>
      </div>
    </div>

    <DisclosurePanel class="sm:hidden">
      <div class="space-y-6 pt-2 pb-6 px-5">
        <HeaderNavLink to="/" name="Dashboard" class="" />
        <HeaderNavLink
          v-for="(nl, i) in nav.filter((n) => !!n)"
          :key="nl.to"
          :to="nl.to"
          :name="nl.name"
          :separator="nl.separator"
        />
      </div>
      <div class="border-t border-background-3 pt-4 pb-4">
        <div class="flex items-center px-4">
          <div class="flex-shrink-0">
            <img class="h-12 w-12 rounded-full" :src="user.imageUrl" alt="" />
          </div>
          <div class="ml-4">
            <div class="text-base font-medium text-foreground">{{ user.name }}</div>
            <div class="text-sm font-medium text-foreground-3">{{ user.email }}</div>
          </div>
          <button
            type="button"
            class="ml-auto flex-shrink-0 rounded-full bg-background p-1 text-foreground-3 hover:text-foreground-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <span class="sr-only">View notifications</span>
            <BellIcon class="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div class="mt-4 space-y-1">
          <DisclosureButton
            v-for="item in userNavigation"
            :key="item.name"
            as="a"
            :href="item.href"
            class="block px-4 py-2 text-base font-medium text-foreground-3 hover:bg-background-2 hover:text-foreground-2"
          >
            {{ item.name }}
          </DisclosureButton>
        </div>
      </div>
    </DisclosurePanel>
  </Disclosure>
</template>
<script setup>
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
  BellIcon,
  XMarkIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/vue/24/solid'

const user = {
  name: 'Tom Cook',
  email: 'tom@example.com',
  imageUrl:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
}

const navigation = [
  { name: 'Dashboard', href: '#', current: true },
  { name: 'Team', href: '#', current: false },
  { name: 'Projects', href: '#', current: false },
  { name: 'Calendar', href: '#', current: false }
]
const userNavigation = [
  { name: 'Your Profile', href: '/login', current: true },
  { name: 'Settings', href: '#' },
  { name: 'Sign out', href: '#' }
]

const darkMode = useCookie('darkMode')
const swapTheme = () => {
  if (!darkMode.value) {
    document.documentElement.classList.add('dark')
    darkMode.value = true
  } else {
    document.documentElement.classList.remove('dark')
    darkMode.value = false
  }
}

const nav = useNav()
</script>
