<template>
  <LayoutPanel form class="mx-auto max-w-screen-md" @submit="onSubmit">
    <template #header>
      <span class="h5 font-medium leading-7">
        One step closer to resetting your password.
      </span>
    </template>
    <template #default>
      <div class="flex flex-col space-y-8">
        <FormTextInput
          type="password"
          name="password"
          label="Password"
          :rules="passwordRules"
          show-label
          show-required
        />
        <FormTextInput
          type="password"
          name="password-repeat"
          label="Password (repeat)"
          :rules="passwordRepeatRules"
          show-label
          show-required
        />
      </div>
    </template>
    <template #footer>
      <FormButton submit full-width :disabled="loading">Save new password</FormButton>
    </template>
  </LayoutPanel>
</template>
<script setup lang="ts">
import { ensureError } from '@speckle/shared'
import { useForm } from 'vee-validate'
import { usePasswordReset } from '~~/lib/auth/composables/passwordReset'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { useNavigateToLogin } from '~~/lib/common/helpers/route'
import { isRequired, isSameAs } from '~~/lib/common/helpers/validation'

type FormValues = {
  password: string
  repeatPassword: string
}

const props = defineProps<{
  token: string
}>()

const { handleSubmit } = useForm<FormValues>()
const { finalize } = usePasswordReset()
const { triggerNotification } = useGlobalToast()
const goToLogin = useNavigateToLogin()

const passwordRules = [isRequired]
const passwordRepeatRules = [...passwordRules, isSameAs('password')]
const loading = ref(false)

const onSubmit = handleSubmit(async ({ password }) => {
  try {
    loading.value = true
    await finalize(password, props.token)
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Password successfully changed',
      description: `You can now log in with your new password`
    })
    goToLogin()
  } catch (e) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Password change failed',
      description: `${ensureError(e).message}`
    })
  } finally {
    loading.value = false
  }
})
</script>
