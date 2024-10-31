<template>
  <form method="post" @submit="onSubmit">
    <div class="flex flex-col">
      <h1 class="text-heading-xl text-center mb-8">Create account with SSO</h1>
    </div>
    <AuthRegisterNewsletter v-model:newsletter-consent="newsletterOptIn" />
    <FormButton size="lg" submit full-width class="mt-8 mb-4">
      Continue with {provider name} SSO
    </FormButton>
    <!-- <AuthRegisterTerms v-if="serverInfo.termsOfService" :server-info="serverInfo" /> -->
  </form>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { useMixpanel } from '~~/lib/core/composables/mp'

defineProps<{
  email?: string
}>()

type FormValues = { newsletterOptIn: boolean }

const { handleSubmit } = useForm<FormValues>()
const newsletterOptIn = ref(false)

const mixpanel = useMixpanel()

const onSubmit = handleSubmit(async () => {})

onMounted(() => {
  mixpanel.track(`Visit SSO Register`)
})
</script>
