<template>
  <div class="md:max-w-xl md:mx-auto">
    <h2 class="text-2xl font-semibold hidden md:block">User profile</h2>
    <p class="text-sm py-4">Manage your profile information</p>
    <SettingsUserDetails class="pt-10 pb-8" :user="user" />
    <SettingsUserPassword class="pt-4 pb-8" :user="user" />
    <hr />
    <SettingsUserDeleteAccount class="py-6" :user="user" />
  </div>
</template>
<script setup lang="ts">
import { useActiveUser } from '~/lib/auth/composables/activeUser'

useHead({
  title: 'Settings - User Profile'
})

const { activeUser: user } = useActiveUser()
</script>
