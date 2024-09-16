<template>
  <div class="flex flex-col space-y-6">
    <SettingsSectionHeader title="Password change" subheading />
    <p class="text-body-xs text-foreground">
      Press the button below to start the password reset process.
      <br />
      Once pressed, you will receive an e-mail with further instructions.
    </p>
    <div>
      <FormButton color="primary" @click="onClick">Reset password</FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { SettingsUserProfileChangePassword_UserFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import { usePasswordReset } from '~~/lib/auth/composables/passwordReset'

graphql(`
  fragment SettingsUserProfileChangePassword_User on User {
    id
    email
  }
`)

const { sendResetEmail } = usePasswordReset()

const props = defineProps<{
  user: SettingsUserProfileChangePassword_UserFragment
}>()

const onClick = async () => {
  const email = props.user.email
  if (!email) return
  await sendResetEmail(email)
}
</script>
