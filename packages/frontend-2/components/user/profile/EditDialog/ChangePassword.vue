<template>
  <LayoutDialogSection border-b title="Change Password" title-color="info">
    <template #icon>
      <LockClosedIcon class="h-full w-full" />
    </template>
    <div class="flex flex-col space-y-4">
      <div>
        Press the button below to start the password reset process. Once pressed, you
        will receive an e-mail with further instructions.
      </div>
      <div class="flex justify-end">
        <FormButton color="info" @click="onClick">Reset password</FormButton>
      </div>
    </div>
  </LayoutDialogSection>
</template>
<script setup lang="ts">
import { LayoutDialogSection } from '@speckle/ui-components'
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
