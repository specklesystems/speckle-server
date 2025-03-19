<template>
  <div>
    <AccountsMenu v-model:open="showAccountsDialog" just-dialog />
    <Menu as="div" class="flex items-center z-100">
      <MenuButton v-slot="{ open }">
        <span class="sr-only">Open user menu</span>
        <FormButton
          color="subtle"
          size="sm"
          :icon-left="!open ? Bars3Icon : XMarkIcon"
          hide-text
        />
        <!-- <HeaderButton>
          <Bars3Icon v-if="!open" class="w-4" />
          <XMarkIcon v-else class="w-4" />
        </HeaderButton> -->
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
          class="absolute right-1 top-8 origin-top-right bg-foundation outline outline-1 outline-outline-5 rounded-md shadow-lg overflow-hidden"
        >
          <MenuItem v-slot="{ active }" @click="toggleTheme">
            <div
              :class="[
                active ? 'bg-highlight-1' : '',
                'my-1 text-body-2xs flex px-2 py-1 text-foreground cursor-pointer transition mx-1 rounded'
              ]"
            >
              {{ isDarkTheme ? 'Light theme' : 'Dark theme' }}
            </div>
          </MenuItem>
          <div class="border-t border-outline-3 mt-1">
            <MenuItem
              v-slot="{ active }"
              @click="
                (e) => {
                  showAccountsDialog = true
                  e.preventDefault()
                }
              "
            >
              <div
                :class="[
                  active ? 'bg-highlight-1' : '',
                  'my-1 text-body-2xs flex px-2 py-1 text-foreground cursor-pointer transition mx-1 rounded'
                ]"
              >
                Manage accounts
              </div>
            </MenuItem>
          </div>
          <div class="border-t border-outline-3 mt-1">
            <MenuItem
              v-slot="{ active }"
              @click="$openUrl(`https://www.speckle.systems?utm=dui`)"
            >
              <div
                :class="[
                  active ? 'bg-highlight-1' : '',
                  'my-1 text-body-2xs flex px-2 py-1 text-foreground cursor-pointer transition mx-1 rounded'
                ]"
              >
                About Speckle
              </div>
            </MenuItem>
          </div>
          <div
            v-if="hasConfigBindings && isDevMode"
            class="mb-2 border-t border-outline-3"
          >
            <MenuItem v-slot="{ active }" @click="$showDevTools">
              <div
                :class="[
                  active ? 'bg-highlight-1' : '',
                  'my-1 text-body-3xs flex px-2 py-1 text-foreground-2 cursor-pointer transition mx-1 rounded'
                ]"
              >
                Open Dev Tools
              </div>
            </MenuItem>

            <MenuItem v-slot="{ active }">
              <NuxtLink
                to="/test"
                :class="[
                  active ? 'bg-highlight-1' : '',
                  'text-body-3xs flex px-2 py-1 text-foreground-2 cursor-pointer transition mx-1 rounded'
                ]"
              >
                Test Page
              </NuxtLink>
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { XMarkIcon, Bars3Icon } from '@heroicons/vue/20/solid'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { useConfigStore } from '~/store/config'

const uiConfigStore = useConfigStore()
const { isDarkTheme, hasConfigBindings, isDevMode } = storeToRefs(uiConfigStore)
const { toggleTheme } = uiConfigStore

const { $showDevTools, $openUrl } = useNuxtApp()
const showAccountsDialog = ref(false)
</script>
