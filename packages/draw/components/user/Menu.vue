<template>
  <div>
    <Menu as="div" class="flex items-center z-100">
      <MenuButton v-slot="{ open }">
        <UserAvatar
          v-if="!showAccountsDialog && account"
          :user="account"
          hover-effect
        />
        <UserAvatar v-else-if="isLoading" hover-effect>
          <div
            class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"
          ></div>
        </UserAvatar>
        <UserAvatar v-else hover-effect>
          <XMarkIcon class="w-6 h-6" />
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
          class="absolute right-1 top-8 origin-top-right bg-foundation outline outline-1 outline-outline-5 rounded-md shadow-lg overflow-hidden"
        >
          <div
            class="border-b border-outline-3 py-1 mt-1 text-xs text-foreground-2 px-3 gap-1 flex flex-col"
          >
            <MenuItem v-if="account">
              <div>{{ account.name }}</div>
            </MenuItem>
          </div>
          <MenuItem v-slot="{ active }" @click="goToApp">
            <div
              :class="[
                active ? 'bg-highlight-1' : '',
                'my-1 text-body-2xs flex px-2 py-1 text-foreground cursor-pointer transition mx-1 rounded'
              ]"
            >
              Go to app
            </div>
          </MenuItem>
          <MenuItem v-slot="{ active }" @click="toggleTheme">
            <div
              :class="[
                active ? 'bg-highlight-1' : '',
                'my-1 text-body-2xs flex px-2 py-1 text-foreground cursor-pointer transition mx-1 rounded'
              ]"
            >
              {{ colorMode.preference === 'light' ? 'Dark theme' : 'Light theme' }}
            </div>
          </MenuItem>
          <MenuItem v-slot="{ active }" @click="signOut">
            <div
              :class="[
                active ? 'bg-highlight-1' : '',
                'my-1 text-body-2xs flex px-2 py-1 text-foreground cursor-pointer transition mx-1 rounded'
              ]"
            >
              Sign out
            </div>
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAccountStore } from '~/stores/account' // Adjust path
import { XMarkIcon } from '@heroicons/vue/20/solid' // Adjust path
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { removeToken } from '~/lib/authn/useAuthManager'
import { useColorMode } from '@vueuse/core'

const router = useRouter()
const showAccountsDialog = ref(false)
const accountStore = useAccountStore()
const canvasStore = useCanvasStore()
const { currentStrokeColor } = storeToRefs(canvasStore)
const account = computed(() => accountStore.account?.account)
const isLoading = computed(() => accountStore.isLoading) // Access isLoading from the store

const colorMode = useColorMode()
const toggleTheme = () => {
  if (colorMode.preference === 'light') {
    colorMode.preference = 'dark'
  } else {
    colorMode.preference = 'light'
  }
  currentStrokeColor.value = colorMode.preference === 'light' ? '#000000' : '#FFFFFF'
}

const signOut = () => {
  removeToken()
  router.replace('/authn/login')
}

const goToApp = () => {
  window.open('https://app.speckle.systems', '_blank')
}
</script>
