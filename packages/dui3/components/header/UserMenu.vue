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
          <MenuItem v-slot="{ active, close }" as="div">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex items-center justify-between px-2 py-3 text-sm text-foreground cursor-pointer transition'
              ]"
              to="/"
              @click="close"
            >
              Home
            </NuxtLink>
          </MenuItem>

          <MenuItem v-slot="{ active, close }" as="div">
            <NuxtLink
              :class="[
                active ? 'bg-foundation-focus' : '',
                'flex items-center justify-between px-2 py-3 text-sm text-foreground cursor-pointer transition'
              ]"
              to="/test"
              @click="close"
            >
              Test Page
            </NuxtLink>
          </MenuItem>
          <MenuItem as="div" class="border border-t-1">Hai</MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
  </div>
</template>
<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/20/solid'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { useInjectedAccounts } from '~/lib/accounts/composables/setup'

const { defaultAccount } = useInjectedAccounts()

const user = computed(() => {
  if (!defaultAccount.value) return { name: 'loading', avatar: undefined }
  return {
    name: defaultAccount.value?.accountInfo.userInfo.name,
    avatar: defaultAccount.value?.accountInfo.userInfo.avatar
  }
})
</script>
