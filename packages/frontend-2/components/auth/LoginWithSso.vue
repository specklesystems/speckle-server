<template>
  <form method="post" class="mt-16" @submit="onSubmit">
    <div class="flex flex-col">
      <h1 class="text-heading-xl text-center mb-8">Speckle SSO login</h1>
      <FormTextInput
        v-bind="bind"
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
        v-on="on"
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
import { useDebouncedTextInput } from '@speckle/ui-components'
import { loginRoute } from '~/lib/common/helpers/route'

type FormValues = { email: string }

const loading = ref(false)
const isSsoAvailable = ref(false)
const isChecking = ref(false)

const { handleSubmit, meta } = useForm<FormValues>({
  initialValues: {
    email: ''
  }
})

const {
  value: email,
  bind,
  on
} = useDebouncedTextInput({
  debouncedBy: 800
})

const onSubmit = handleSubmit(async () => {
  if (!isSsoAvailable.value) return
  loading.value = true
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))
  loading.value = false
})

const buttonText = computed(() => {
  if (isChecking.value) return 'Checking...'
  if (!meta.value.valid) return 'Single Sign-On'
  if (!isSsoAvailable.value) return 'Single Sign-On not available'
  return 'Sign in with domain' // todo
})

// Watch email changes and check SSO availability
watch(email, async (newEmail) => {
  if (meta.value.valid && newEmail) {
    isChecking.value = true
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    // Dummy logic: emails ending with @speckle.systems are valid
    isSsoAvailable.value = newEmail.endsWith('@speckle.systems')
    isChecking.value = false
  } else {
    isSsoAvailable.value = false
  }
})
</script>
