<template>
  <div class="md:max-w-xl md:mx-auto">
    <h2 class="h3 font-semibold hidden md:block">Profile</h2>
    <div class="divide-y">
      <p class="py-8">Manage your profile information</p>
      <SettingsUserDetails class="py-8" :user="user" />
      <SettingsUserPassword class="py-8" :user="user" />
      <SettingsUserDeleteAccount class="py-8" :user="user" />
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
