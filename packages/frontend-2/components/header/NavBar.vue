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
            <!-- Profile dropdown -->
            <HeaderNavUserMenu />
          </div>
        </div>
      </div>
    </div>
    <PopupsSignIn v-if="!activeUser" />
  </nav>
</template>
<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
const { activeUser } = useActiveUser()
</script>
