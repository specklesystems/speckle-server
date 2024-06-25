<template>
  <div>
    <Portal to="navigation" />
    <SettingsDebug />
    <div class="md:max-w-xl md:mx-auto md:py-12">
      <h1 class="h2">Profile</h1>
      <div class="mt-4 divide-y">
        <p class="py-8">Manage your profile information</p>
        <SettingsUserDetails class="py-8" :user="user" />
        <SettingsUserPassword class="py-8" :user="user" />
        <SettingsUserDeleteAccount class="py-8" :user="user" />
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
