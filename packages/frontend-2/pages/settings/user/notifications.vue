<template>
  <div>
    <Portal to="navigation" />
    <SettingsDebug />
    <div class="md:max-w-xl md:mx-auto md:py-12">
      <h1 class="h2">Notifications</h1>
      <div class="mt-4 divide-y">
        <p class="py-8">Your notification preferences</p>
        <SettingsUserNotifications class="py-8" :user="user" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useActiveUser } from '~/lib/auth/composables/activeUser'

useHead({
  title: 'Settings - User Profile'
})

const { activeUser: user } = useActiveUser()
</script>
