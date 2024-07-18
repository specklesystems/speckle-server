<template>
  <div class="md:max-w-xl md:mx-auto">
    <SettingsSectionHeader title="Profile" text="Manage your profile information" />
    <template v-if="user">
      <SettingsUserProfileDetails :user="user" />
      <hr class="my-6 md:my-10" />
      <SettingsUserProfileChangePassword :user="user" />
      <hr class="my-6 md:my-10" />
      <SettingsUserProfileDeleteAccount :user="user" />
    </template>
  </div>
</template>
<script setup lang="ts">
import { useActiveUser } from '~/lib/auth/composables/activeUser'

const { activeUser: user } = useActiveUser()
</script>
