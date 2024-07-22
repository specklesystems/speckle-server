<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader title="Profile" text="Manage your profile information" />
      <SettingsUserProfileDetails :user="user" />
      <hr class="my-6 md:my-10" />
      <SettingsUserProfileChangePassword :user="user" />
      <hr class="my-6 md:my-10" />
      <SettingsUserProfileDeleteAccount :user="user" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { SettingsUserProfile_UserFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment SettingsUserProfile_User on User {
    ...UserProfileEditDialogChangePassword_User
    ...UserProfileEditDialogDeleteAccount_User
    ...UserProfileEditDialogBio_User
  }
`)

defineProps<{
  user: SettingsUserProfile_UserFragment
}>()
</script>
