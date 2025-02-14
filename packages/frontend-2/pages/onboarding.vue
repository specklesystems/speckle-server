<template>
  <HeaderWithEmptyPage empty-header>
    <template #header-left>
      <HeaderLogoBlock no-link />
    </template>
    <template #header-right>
      <div class="flex gap-2 items-center">
        <FormButton
          v-if="!isOnboardingForced"
          class="opacity-70 hover:opacity-100 p-1"
          size="sm"
          color="subtle"
          @click="setUserOnboardingComplete()"
        >
          Skip
        </FormButton>
        <FormButton color="outline" @click="() => logout({ skipRedirect: false })">
          Sign out
        </FormButton>
      </div>
    </template>
    <div class="flex flex-col items-center justify-center p-4 max-w-lg mx-auto">
      <h1 class="text-heading-xl text-forefround mb-2 font-normal">
        Tell us about yourself
      </h1>
      <p class="text-center text-body-sm text-foreground-2 mb-8">
        Your answers will help us improve
      </p>
      <OnboardingQuestionsForm />
    </div>
  </HeaderWithEmptyPage>
</template>

<script setup lang="ts">
import { useProcessOnboarding } from '~~/lib/auth/composables/onboarding'
import { useAuthManager } from '~/lib/auth/composables/auth'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

useHead({
  title: 'Welcome to Speckle'
})

definePageMeta({
  middleware: ['auth'],
  layout: 'empty'
})

const isOnboardingForced = useIsOnboardingForced()

const { setUserOnboardingComplete, createOnboardingProject } = useProcessOnboarding()
const { activeUser } = useActiveUser()
const { logout } = useAuthManager()

onMounted(() => {
  if (activeUser.value?.versions.totalCount === 0) {
    createOnboardingProject()
  }
})
</script>
