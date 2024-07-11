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
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { usePasswordReset } from '~~/lib/auth/composables/passwordReset'

const { activeUser } = useActiveUser()
const { sendResetEmail } = usePasswordReset()

const onClick = async () => {
  const email = activeUser.value?.email
  if (!email) return
  await sendResetEmail(email)
}
</script>
