<template>
  <div>
    <Menu as="div" class="ml-2 flex items-center">
      <MenuButton v-slot="{ open }">
        <span class="sr-only">Open user menu</span>

        <UserAvatar v-if="!open" size="lg" :user="user" hover-effect />
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
          class="absolute right-0 md:right-4 top-14 md:top-16 w-full md:w-64 origin-top-right bg-foundation sm:rounded-t-md rounded-b-md shadow-lg overflow-hidden"
        >
          <MenuItem>
            <div class="border border-t-1 border-primary-muted">
              <div v-if="loading" class="p-2">Loading accounts...</div>
              <div v-else class="p-2 flex items-center justify-between">
                <div class="text-xs text-foreground-2">Your accounts</div>
                <div>
                  <FormButton
                    text
                    size="xs"
                    @click.stop="accountStore.refreshAccounts()"
                  >
                    Refresh
                  </FormButton>
                </div>
              </div>
              <div class="space-y-0">
                <HeaderUserAccount
                  v-for="acc in accounts"
                  :key="acc.accountInfo.id"
                  :account="(acc as DUIAccount)"
                />
              </div>
            </div>
          </MenuItem>
          <MenuItem v-slot="{ close }" as="div">
            <div class="px-2 py-3 flex space-x-2 border-t-1 justify-between">
              <div class="">
                <button
                  class="text-xs text-foreground-2 hover:text-primary transition"
                  @click="$showDevTools"
                >
                  Open Dev Tools
                </button>
                <NuxtLink
                  class="text-xs text-foreground-2 hover:text-primary transition"
                  to="/test"
                  @click="close()"
                >
                  Test Page
                </NuxtLink>
              </div>
              <!-- 
                NOTE: Here's an example of customising the frontend app based on what bindings we
                have loaded. E.g., if config bindings are not present, we do not show any button
                regarding switching themes. 
              -->
              <div v-if="hasConfigBindings">
                <FormButton size="xs" text @click.stop="toggleTheme()">
                  {{ isDarkTheme ? 'Switch To Light Theme' : 'Switch To Dark Theme' }}
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
import { storeToRefs } from 'pinia'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { useAccountStore } from '~/store/accounts'
import type { DUIAccount } from '~/lib/accounts/composables/setup'
import { useDocumentInfoStore } from '~/store/uiConfig'

const accountStore = useAccountStore()
const { accounts, defaultAccount, loading } = storeToRefs(accountStore)

const uiConfigStore = useDocumentInfoStore()
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
