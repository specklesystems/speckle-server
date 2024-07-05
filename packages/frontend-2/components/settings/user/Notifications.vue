<template>
  <div class="md:max-w-xl md:mx-auto">
    <h2 class="text-2xl font-semibold font-semibold hidden md:block">Notifications</h2>
    <p class="text-sm pt-6 md:pt-4">Manage your notification preferences</p>
    <hr class="my-6 md:my-10" />
    <SettingsUserNotificationsTable class="py-8" :user="user" />
  </div>
</template>
<script setup lang="ts">
import { useActiveUser } from '~/lib/auth/composables/activeUser'

useHead({
  title: 'Settings - User Profile'
})

const { activeUser: user } = useActiveUser()
</script>
