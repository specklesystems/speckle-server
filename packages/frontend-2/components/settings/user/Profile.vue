<template>
  <div class="md:max-w-xl md:mx-auto">
    <SettingsSectionHeader
      title="User Profile"
      text="Manage your profile information"
    />
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
