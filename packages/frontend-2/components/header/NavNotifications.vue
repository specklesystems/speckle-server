<template>
  <div v-if="hasNotifications">
    <Menu as="div" class="flex items-center">
      <MenuButton v-slot="{ open: menuOpen }" as="div">
        <div class="cursor-pointer">
          <span class="sr-only">Open notifications menu</span>
          <div class="relative">
            <div v-if="hasNotifications && !menuOpen">
              <div
                class="absolute top-1 right-1 w-3 h-3 rounded-full bg-primary animate-ping"
              ></div>
              <div class="absolute top-1 right-1 w-3 h-3 rounded-full bg-primary"></div>
            </div>

            <UserAvatar v-if="!menuOpen" no-bg size="lg" hover-effect>
              <BellIcon class="text-foreground w-5 h-5" />
            </UserAvatar>
            <UserAvatar v-else size="lg" hover-effect no-bg>
              <XMarkIcon class="text-foreground w-5 h-5" />
            </UserAvatar>
          </div>
        </div>
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
          class="absolute z-50 right-0 md:right-14 top-14 md:top-16 w-full md:w-64 origin-top-right bg-foundation outline outline-2 outline-primary-muted rounded-md shadow-lg overflow-hidden"
        >
          <div class="p-2 text-sm font-bold">Notifications</div>
          <div class="p-2 text-sm">TODO: project invites</div>
          <MenuItem>
            <AuthVerificationReminderMenuNotice />
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
  </div>
</template>
<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { XMarkIcon, BellIcon } from '@heroicons/vue/24/solid'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

const { activeUser } = useActiveUser()

const hasNotifications = computed(() => {
  if (!activeUser.value?.verified) return true
})
</script>
