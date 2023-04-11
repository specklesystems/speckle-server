<template>
  <form @submit="onSubmit">
    <div class="flex flex-col space-y-2">
      <FormTextInput
        type="email"
        name="email"
        label="E-mail"
        placeholder="Enter your email"
        size="xl"
        :rules="emailRules"
        show-label
        :disabled="loading"
        auto-focus
      />
      <FormTextInput
        type="password"
        name="password"
        label="Password"
        placeholder="Enter your password"
        size="xl"
        :rules="passwordRules"
        show-label
        :disabled="loading"
      />
    </div>
    <div class="mt-1">
      <CommonTextLink :to="forgottenPasswordRoute" size="sm">
        Forgot your password?
      </CommonTextLink>
    </div>
    <FormButton submit full-width class="my-8" :disabled="loading">Log in</FormButton>
    <div class="text-center">
      <span class="mr-2">Don't have an account?</span>
      <CommonTextLink :to="finalRegisterRoute" :icon-right="ArrowRightIcon">
        Register
      </CommonTextLink>
    </div>
  </form>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { isEmail, isRequired } from '~~/lib/common/helpers/validation'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { ensureError } from '@speckle/shared'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import { forgottenPasswordRoute, registerRoute } from '~~/lib/common/helpers/route'
import { ArrowRightIcon } from '@heroicons/vue/20/solid'

type FormValues = { email: string; password: string }

const props = defineProps<{
  challenge: string
}>()

const { handleSubmit } = useForm<FormValues>()

const loading = ref(false)
const emailRules = [isEmail]
const passwordRules = [isRequired]

const { loginWithEmail, inviteToken } = useAuthManager()
const { triggerNotification } = useGlobalToast()
const router = useRouter()

const finalRegisterRoute = computed(() => {
  const result = router.resolve({
    path: registerRoute,
    query: inviteToken.value ? { token: inviteToken.value } : {}
  })
  return result.fullPath
})

const onSubmit = handleSubmit(async ({ email, password }) => {
  try {
    loading.value = true
    await loginWithEmail({ email, password, challenge: props.challenge })
  } catch (e) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Login failed',
      description: `${ensureError(e).message}`
    })
  } finally {
    loading.value = false
  }
})
</script>
