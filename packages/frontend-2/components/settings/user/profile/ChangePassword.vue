<template>
  <div class="flex flex-col space-y-6">
    <SettingsSectionHeader title="Change password" subheading />
    <p class="text-sm">
      Press the button below to start the password reset process.
      <br />
      Once pressed, you will receive an e-mail with further instructions.
    </p>
    <div>
      <FormButton color="default" @click="onClick">Reset password</FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { UserProfileEditDialogChangePassword_UserFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import { usePasswordReset } from '~~/lib/auth/composables/passwordReset'

graphql(`
  fragment UserProfileEditDialogChangePassword_User on User {
    id
    email
  }
`)

const { sendResetEmail } = usePasswordReset()

const props = defineProps<{
  user: UserProfileEditDialogChangePassword_UserFragment
}>()

const onClick = async () => {
  const email = props.user.email
  if (!email) return
  await sendResetEmail(email)
}
</script>
