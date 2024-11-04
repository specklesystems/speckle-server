<template>
  <form method="post" @submit="onSubmit">
    <div class="flex flex-col">
      <h1 class="text-heading-xl text-center mb-8">Speckle SSO login</h1>
      <FormTextInput
        v-model:model-value="email"
        type="email"
        name="email"
        label="Your work email"
        placeholder="Enter your email"
        size="lg"
        color="foundation"
        :rules="[isEmail, isRequired]"
        show-label
        :disabled="!!loading"
        auto-focus
        @update:model-value="onEmailChange"
      />
    </div>
    <FormButton
      size="lg"
      submit
      full-width
      class="mt-8 mb-4"
      :disabled="loading || !meta.valid || !isSsoAvailable"
    >
      {{ buttonText }}
    </FormButton>
    <FormButton size="lg" color="subtle" full-width :to="loginRoute">
      Back to login
    </FormButton>
  </form>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { isEmail, isRequired } from '~~/lib/common/helpers/validation'
import { loginRoute } from '~/lib/common/helpers/route'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useQuery } from '@vue/apollo-composable'
import { workspaceSsoByEmailQuery } from '~/lib/workspaces/graphql/queries'
import { debounce } from 'lodash'
import { useAuthManager, useLoginOrRegisterUtils } from '~/lib/auth/composables/auth'

type FormValues = { email: string }

const loading = ref(false)
const email = ref('')
const debouncedEmail = ref('')

const { handleSubmit, meta } = useForm<FormValues>()
const mixpanel = useMixpanel()
const { challenge } = useLoginOrRegisterUtils()
const { signInOrSignUpWithSso } = useAuthManager()
const logger = useLogger()

const { loading: isChecking, result } = useQuery(
  workspaceSsoByEmailQuery,
  () => ({
    email: debouncedEmail.value
  }),
  () => ({
    enabled: meta.value.valid && !!debouncedEmail.value
  })
)

const isSsoAvailable = computed(() => {
  return (result.value?.workspaceSsoByEmail.length ?? 0) > 0
})

const workspaceSlug = computed(() => {
  return result.value?.workspaceSsoByEmail[0]?.slug
})

const onEmailChange = (value: string) => {
  email.value = value
  updateDebouncedEmail(value)
}

const onSubmit = handleSubmit(() => {
  if (!isSsoAvailable.value || !workspaceSlug.value) return
  loading.value = true

  try {
    signInOrSignUpWithSso({
      challenge: challenge.value,
      workspaceSlug: workspaceSlug.value
    })
  } catch (error) {
    logger.error('SSO login failed:', error)
  } finally {
    loading.value = false
  }
})

const buttonText = computed(() => {
  if (isChecking.value) return 'Checking...'
  if (!meta.value.valid) return 'Single Sign-On'
  if (!isSsoAvailable.value) return 'Single Sign-On not available'
  return 'Sign in with domain'
})

// Debounced function to update the email used for validation
const updateDebouncedEmail = debounce((value: string) => {
  debouncedEmail.value = value
}, 800)

onMounted(() => {
  mixpanel.track(`Visit SSO Login`)
})
</script>
