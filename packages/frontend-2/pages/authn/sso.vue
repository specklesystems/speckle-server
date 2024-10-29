<template>
  <div class="mt-12 max-w-md mx-auto">
    <h1 class="text-heading-xl text-center mb-8">Speckle SSO login</h1>
    <FormTextInput
      type="email"
      name="email"
      label="Your work email"
      placeholder="Enter your email"
      size="lg"
      color="foundation"
      :rules="emailRules"
      show-label
      auto-focus
    />
    <div class="flex flex-col gap-2 mt-6">
      <FormButton full-width size="lg">Login</FormButton>
      <FormButton to="/" color="subtle" size="lg" full-width>Back to login</FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useMixpanel } from '~~/lib/core/composables/mp'
import { isEmail } from '~~/lib/common/helpers/validation'

const mixpanel = useMixpanel()
const emailRules = [isEmail]

useHead({ title: 'Speckle SSO login' })

onMounted(() => {
  mixpanel.track('Visit SSO Log In')
})
</script>
