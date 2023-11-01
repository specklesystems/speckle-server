<template>
  <nav
    class="fixed top-0 h-14 bg-foundation max-w-full w-full shadow hover:shadow-md transition z-20"
  >
    <div class="px-4">
      <div class="flex items-center h-14 transition-all justify-between">
        <div class="flex items-center">
          <HeaderLogoBlock :active="false" class="mr-0" />
          <div class="flex flex-shrink-0 items-center -ml-2 md:ml-0">
            <HeaderNavLink
              to="/"
              name="Dashboard"
              :separator="true"
              class="hidden md:inline-block"
            />
            <PortalTarget name="navigation"></PortalTarget>
          </div>
        </div>
        <div>
          <div class="flex items-center">
            <div class="hidden sm:flex">
              <PortalTarget name="secondary-actions"></PortalTarget>
              <PortalTarget name="primary-actions"></PortalTarget>
            </div>
            <!-- Notifications dropdown -->
            <HeaderNavNotifications />
            <!-- Profile -->
            <button
              class="relative group cursor-pointer"
              @click="showProfileEditDialog = true"
            >
              <UserAvatar size="lg" :user="activeUser" />
              <div
                class="opacity-0 group-hover:opacity-90 transition-all duration-200 absolute inset-0 bg-primary text-white rounded-full flex items-center justify-center"
              >
                <PencilIcon class="h-4 w-4" />
              </div>
            </button>
            <!-- Menu dropdown -->
            <HeaderNavUserMenu hover-effect />
          </div>
        </div>
      </div>
    </div>
    <PopupsSignIn v-if="!activeUser" />
    <UserProfileEditDialog v-model:open="showProfileEditDialog" />
  </nav>
</template>
<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
const { activeUser } = useActiveUser()

import { PencilIcon } from '@heroicons/vue/24/solid'

const showProfileEditDialog = ref(false)
</script>
