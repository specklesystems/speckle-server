<template>
  <div>
    <nav class="fixed z-20 top-0 h-14 bg-foundation shadow hover:shadow-md transition">
      <div class="flex gap-4 items-center justify-between h-full w-screen px-4">
        <div class="flex items-center truncate">
          <HeaderLogoBlock :active="false" />
          <HeaderNavLink
            to="/"
            name="Dashboard"
            :separator="true"
            class="hidden md:inline-block"
          />
          <PortalTarget name="navigation"></PortalTarget>
        </div>
        <div class="flex items-center gap-2">
          <PortalTarget name="secondary-actions"></PortalTarget>
          <PortalTarget name="primary-actions"></PortalTarget>
          <!-- Notifications dropdown -->
          <HeaderNavNotifications />
          <!-- Profile dropdown -->
          <HeaderNavUserMenu />
        </div>
      </div>
      <PopupsSignIn v-if="!activeUser" />
    </nav>
    <div class="h-16"></div>
  </div>
</template>
<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
const { activeUser } = useActiveUser()
</script>
