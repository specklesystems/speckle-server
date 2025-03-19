<template>
  <div>
    <Menu as="div" class="ml-1 flex items-center z-100">
      <MenuButton v-slot="{ open }">
        <span class="sr-only">Open user menu</span>
        <button
          class="rounded-full transition hover:bg-primary hover:text-foreground-on-primary p-1"
        >
          <Bars3Icon v-if="!open" class="w-4" />
          <XMarkIcon v-else class="w-4" />
        </button>
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
          class="absolute right-1 top-11 origin-top-right bg-foundation outline outline-1 outline-primary-muted rounded-md shadow-lg overflow-hidden"
        >
          <MenuItem v-slot="{ active }" @click="showFeedbackDialog = true">
            <div
              :class="[
                active ? 'bg-highlight-1' : '',
                'my-1 text-body-xs flex px-2 py-1 text-foreground cursor-pointer transition mx-1 rounded'
              ]"
            >
              Feedback
            </div>
          </MenuItem>
          <MenuItem v-slot="{ active }" @click="toggleTheme">
            <div
              :class="[
                active ? 'bg-highlight-1' : '',
                'my-1 text-body-xs flex px-2 py-1 text-foreground cursor-pointer transition mx-1 rounded'
              ]"
            >
              {{ isDarkTheme ? 'Light mode' : 'Dark mode' }}
            </div>
          </MenuItem>
          <div v-if="hasConfigBindings && isDevMode">
            <div class="border-t border-outline-3 py-1 mt-1">
              <MenuItem v-slot="{ active }" @click="$showDevTools">
                <div
                  :class="[
                    active ? 'bg-highlight-1' : '',
                    'my-1 text-body-xs flex px-2 py-1 text-foreground cursor-pointer transition mx-1 rounded'
                  ]"
                >
                  Open Dev Tools
                </div>
              </MenuItem>
            </div>
            <MenuItem v-slot="{ active }">
              <NuxtLink
                to="/test"
                :class="[
                  active ? 'bg-highlight-1' : '',
                  'text-body-xs flex px-2 py-1 text-foreground cursor-pointer transition mx-1 rounded'
                ]"
              >
                Test Page
              </NuxtLink>
            </MenuItem>
          </div>
          <div class="border-t border-outline-3 py-1 mt-1">
            <MenuItem>
              <div class="px-3 pt-1 text-tiny text-foreground-2">
                Version {{ hostApp.connectorVersion }}
              </div>
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
    <FeedbackDialog v-model:open="showFeedbackDialog" />
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { XMarkIcon, Bars3Icon } from '@heroicons/vue/20/solid'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { useConfigStore } from '~/store/config'
import { useHostAppStore } from '~/store/hostApp'

const uiConfigStore = useConfigStore()
const { isDarkTheme, hasConfigBindings, isDevMode } = storeToRefs(uiConfigStore)
const { toggleTheme } = uiConfigStore
const hostApp = useHostAppStore()

const { $showDevTools } = useNuxtApp()

const showFeedbackDialog = ref<boolean>(false)
</script>
