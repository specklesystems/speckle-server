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
import type {
  UserProfileEditDialogChangePassword_UserFragment,
  UserProfileEditDialogBio_UserFragment,
  UserProfileEditDialogDeleteAccount_UserFragment
} from '~~/lib/common/generated/gql/graphql'

type CombinedUser = UserProfileEditDialogChangePassword_UserFragment &
  UserProfileEditDialogDeleteAccount_UserFragment &
  UserProfileEditDialogBio_UserFragment

defineProps<{
  user: CombinedUser
}>()
</script>
