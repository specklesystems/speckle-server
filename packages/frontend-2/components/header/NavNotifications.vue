<template>
  <div>
    <Menu as="div" class="flex items-center">
      <MenuButton :id="menuButtonId" v-slot="{ open: menuOpen }" as="div">
        <div
          class="relative cursor-pointer p-1 w-8 h-8 flex items-center justify-center rounded-md"
          :class="menuOpen ? 'border border-outline-2' : ''"
        >
          <span class="sr-only">Open notifications menu</span>
          <div class="relative">
            <div v-if="!menuOpen">
              <div
                class="absolute -top-1 right-0 w-1.5 h-1.5 rounded-full bg-primary animate-ping"
              ></div>
              <div
                class="absolute -top-1 right-0 w-1.5 h-1.5 rounded-full bg-primary"
              ></div>
            </div>

            <BellIcon v-if="!menuOpen" class="w-5 h-5" />
            <XMarkIcon v-else class="w-5 h-5" />
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
          class="absolute z-50 right-0 md:right-20 top-10 mt-1.5 w-full sm:w-64 origin-top-right bg-foundation-page outline outline-2 outline-primary-muted rounded-md shadow-lg overflow-hidden"
        >
          <div class="px-3 py-2 text-body-xs font-medium">Notifications</div>
          <!-- <div class="p-2 text-sm">TODO: project invites</div> -->
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
import { XMarkIcon, BellIcon } from '@heroicons/vue/24/outline'

const menuButtonId = useId()
</script>
