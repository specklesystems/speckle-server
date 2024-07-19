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
import type { User } from '~~/lib/common/generated/gql/graphql'
import { usePasswordReset } from '~~/lib/auth/composables/passwordReset'

const { sendResetEmail } = usePasswordReset()

const props = defineProps<{
  user: User
}>()

const onClick = async () => {
  const email = props.user.email
  if (!email) return
  await sendResetEmail(email)
}
</script>
