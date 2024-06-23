<template>
  <div>
    <Menu as="div" class="ml-1 flex items-center z-100">
      <MenuButton v-slot="{ open }">
        <span class="sr-only">Open user menu</span>
        <button
          class="rounded-full transition hover:bg-primary hover:text-foreground-on-primary p-1 shadow-md"
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
          class="absolute right-0 md:right-4 top-10 md:top-16 w-full md:w-64 origin-top-right bg-foundation sm:rounded-t-md rounded-b-2xl shadow-lg overflow-hidden"
        >
          <MenuItem v-slot="{ close }" as="div">
            <div class="px-2 py-3 flex flex-col space-y-2 border-t-1 justify-between">
              <!-- <div class="flex space-x-2"> -->
              <FormButton
                size="sm"
                color="secondary"
                class="text-xs text-foreground-2 hover:text-primary transition"
                @click="$showDevTools"
              >
                Open Dev Tools
              </FormButton>

              <FormButton
                size="sm"
                color="secondary"
                class="text-xs text-foreground-2 hover:text-primary transition"
                to="/test"
                @click="close()"
              >
                Test Page
              </FormButton>
              <!-- </div> -->
              <!-- 
                NOTE: Here's an example of customising the frontend app based on what bindings we
                have loaded. E.g., if config bindings are not present, we do not show any button
                regarding switching themes. 
              -->
              <div v-if="hasConfigBindings">
                <FormButton size="xs" text full-width @click="toggleTheme()">
                  {{ isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme' }}
                </FormButton>
              </div>
            </div>
          </MenuItem>
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
const { isDarkTheme, hasConfigBindings } = storeToRefs(uiConfigStore)
const { toggleTheme } = uiConfigStore

const { $showDevTools } = useNuxtApp()
</script>
