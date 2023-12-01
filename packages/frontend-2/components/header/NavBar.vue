<template>
  <nav class="fixed z-20 top-0 h-14 bg-foundation shadow hover:shadow-md transition">
    <div class="flex items-center justify-between h-full w-screen px-4">
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
    <PopupsSignIn v-if="!activeUser" />
  </nav>
</template>
<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
const { activeUser } = useActiveUser()
</script>
