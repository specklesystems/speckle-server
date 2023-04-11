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
import { useForm } from 'vee-validate'
import { usePasswordReset } from '~~/lib/auth/composables/passwordReset'
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

const passwordRules = [isRequired]
const passwordRepeatRules = [...passwordRules, isSameAs('password')]
const loading = ref(false)

const onSubmit = handleSubmit(
  async ({ password }) => await finalize(password, props.token)
)
</script>
