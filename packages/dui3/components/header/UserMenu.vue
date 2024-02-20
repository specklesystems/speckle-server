<template>
  <div>
    <Menu as="div" class="ml-1 flex items-center z-100">
      <MenuButton v-slot="{ open }">
        <span class="sr-only">Open user menu</span>

        <UserAvatar v-if="!open" :user="user" hover-effect />
        <UserAvatar v-else hover-effect>
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
          class="absolute right-0 md:right-4 top-10 md:top-16 w-full md:w-64 origin-top-right bg-foundation sm:rounded-t-md rounded-b-2xl shadow-lg overflow-hidden"
        >
          <MenuItem v-slot="{ close }" as="div">
            <div class="px-2 py-3 flex flex-col space-y-2 border-t-1 justify-between">
              <FormButton
                class="text-xs text-foreground-2 hover:text-primary transition"
                @click="$showDevTools"
              >
                Open Dev Tools
              </FormButton>

              <FormButton
                class="text-xs text-foreground-2 hover:text-primary transition"
                to="/test"
                @click="close()"
              >
                Test Page
              </FormButton>
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
import { XMarkIcon } from '@heroicons/vue/20/solid'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { useAccountStore } from '~/store/accounts'
import { useConfigStore } from '~/store/config'

const accountStore = useAccountStore()
const { defaultAccount } = storeToRefs(accountStore)

const uiConfigStore = useConfigStore()
const { isDarkTheme, hasConfigBindings } = storeToRefs(uiConfigStore)
const { toggleTheme } = uiConfigStore

const { $showDevTools } = useNuxtApp()

const user = computed(() => {
  if (!defaultAccount.value) return undefined
  return {
    name: defaultAccount.value?.accountInfo.userInfo.name,
    avatar: defaultAccount.value?.accountInfo.userInfo.avatar
  }
})
</script>
