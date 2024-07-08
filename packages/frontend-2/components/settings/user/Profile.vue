<template>
  <div class="md:max-w-xl md:mx-auto">
    <h2 class="text-2xl font-semibold hidden md:block">User Profile</h2>
    <p class="text-sm pt-2 md:pt-4">Manage your profile information</p>
    <hr class="my-6 md:my-10" />
    <SettingsUserProfileDetails :user="user" />
    <hr class="my-6 md:my-10" />
    <SettingsUserProfilePassword :user="user" />
    <hr class="my-6 md:my-10" />
    <SettingsUserProfileDeleteAccount :user="user" />
  </div>
</template>
<script setup lang="ts">
import { useActiveUser } from '~/lib/auth/composables/activeUser'

const { activeUser: user } = useActiveUser()
</script>
