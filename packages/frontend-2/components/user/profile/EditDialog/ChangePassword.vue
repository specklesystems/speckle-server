<template>
  <LayoutDisclosure title="Change password" :icon="LockClosedIcon">
    <div class="flex flex-col space-y-4">
      <div>
        Press the button below to start the password reset process. Once pressed, you
        will receive an e-mail with further instructions.
      </div>
      <div class="flex justify-end">
        <FormButton size="sm" @click="onClick">Reset password</FormButton>
      </div>
    </div>
  </LayoutDisclosure>
</template>
<script setup lang="ts">
import { LockClosedIcon } from '@heroicons/vue/24/outline'
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
