<template>
  <form class="mx-auto w-full px-2" @submit="onSubmit">
    <h1 class="text-heading-xl text-center inline-block mb-4">Reset your password</h1>

    <div class="flex flex-col space-y-2 text-body-sm">
      <div class="mb-4">One step closer to resetting your password</div>
      <FormTextInput
        type="password"
        name="password"
        label="Password"
        placeholder="New password"
        color="foundation"
        size="lg"
        :rules="passwordRules"
        show-label
        show-required
      />
      <FormTextInput
        type="password"
        name="password-repeat"
        label="Password (confirmation)"
        color="foundation"
        size="lg"
        :rules="passwordRepeatRules"
        placeholder="Confirm new password"
        show-label
        show-required
      />
    </div>

    <FormButton class="mt-4" submit full-width size="lg" :disabled="loading">
      Reset password
    </FormButton>
  </form>
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
