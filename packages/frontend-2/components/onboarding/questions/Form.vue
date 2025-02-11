<template>
  <form class="w-full flex flex-col gap-4" @submit="onSubmit">
    <OnboardingQuestionsRoleSelect v-model="values.role" name="role" required />
    <OnboardingQuestionsPlanSelect v-model="values.plan" name="plan" required />
    <OnboardingQuestionsSourceSelect v-model="values.source" name="source" required />
    <div class="mt-2 flex flex-col gap-4">
      <FormButton size="lg" :disabled="!meta.valid || isSubmitting" submit full-width>
        Continue
      </FormButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import type {
  OnboardingRole,
  OnboardingPlan,
  OnboardingSource
} from '~/lib/auth/helpers/onboarding'
import { useProcessOnboarding } from '~~/lib/auth/composables/onboarding'
import { homeRoute } from '~/lib/common/helpers/route'

const { setUserOnboardingComplete, setMixpanelSegments } = useProcessOnboarding()

const { handleSubmit, meta, isSubmitting, values } = useForm({
  initialValues: {
    role: undefined as OnboardingRole | undefined,
    plan: [] as OnboardingPlan[],
    source: undefined as OnboardingSource | undefined
  }
})

const onSubmit = handleSubmit(async () => {
  if (values.role) {
    setMixpanelSegments({ role: values.role })
  }
  await setUserOnboardingComplete()
  navigateTo(homeRoute)
})
</script>
