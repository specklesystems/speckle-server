<template>
  <div class="md:max-w-xl md:mx-auto">
    <SettingsSectionHeader title="Profile" text="Manage your profile information" />
    <SettingsUserProfileDetails :user="user" />
    <hr class="my-6 md:my-10" />
    <SettingsUserProfileChangePassword :user="user" />
    <hr class="my-6 md:my-10" />
    <SettingsUserProfileDeleteAccount :user="user" />
  </div>
</template>

<script setup lang="ts">
import type { User } from '~~/lib/common/generated/gql/graphql'

defineProps<{
  user: User
}>()
</script>
