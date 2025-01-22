<template>
  <div class="flex flex-col items-center justify-center p-4 max-w-sm mx-auto">
    <h1 class="text-heading-xl text-forefround mb-2 font-normal">
      Tell us about yourself
    </h1>
    <p class="text-center text-body-sm text-foreground-2">
      Your answers will help us improve
    </p>
    <form class="mt-8 w-full space-y-6" @submit="onSubmit">
      <OnboardingRoleSelect v-model="values.role" name="role" required />
      <OnboardingPlanSelect v-model="values.plan" name="plan" required />
      <OnboardingSourceSelect v-model="values.source" name="source" required />
      <div class="mt-2 flex flex-col gap-4">
        <FormButton size="lg" :disabled="!meta.valid || isSubmitting" submit full-width>
          Continue
        </FormButton>
        <div class="opacity-60 hover:opacity-100 max-w-max mx-auto px-1">
          <FormButton
            size="sm"
            text
            link
            color="subtle"
            full-width
            @click="setUserOnboardingComplete"
          >
            Skip
          </FormButton>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { useProcessOnboarding } from '~~/lib/auth/composables/onboarding'
import { isRequired } from '~~/lib/common/helpers/validation'
import type {
  OnboardingRole,
  OnboardingPlan,
  OnboardingSource
} from '~/lib/auth/helpers/onboarding'

useHead({
  title: 'Welcome to Speckle'
})

definePageMeta({
  middleware: ['auth'],
  layout: 'onboarding'
})

const { handleSubmit, meta, isSubmitting, values } = useForm({
  initialValues: {
    role: undefined as OnboardingRole | undefined,
    plan: [] as OnboardingPlan[],
    source: undefined as OnboardingSource | undefined
  },
  validationSchema: {
    role: isRequired,
    plan: isRequired,
    source: isRequired
  }
})

const { setUserOnboardingComplete, setMixpanelSegments } = useProcessOnboarding()

const onSubmit = handleSubmit(async () => {
  if (values.role) {
    setMixpanelSegments({ role: values.role })
  }
  await setUserOnboardingComplete()
})
</script>
