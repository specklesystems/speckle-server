<!-- FF-CLEANUP: Remove when workspaces plans released -->
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
    <template v-if="isLoading">
      <div class="py-12 flex flex-col items-center gap-2">
        <CommonLoadingIcon />
      </div>
    </template>
    <div v-else class="flex flex-col items-center justify-center p-4 max-w-lg mx-auto">
      <h1 class="text-heading-xl text-forefround mb-2 font-normal">
        {{ currentStage === 'join' ? 'Join your teammates' : 'Tell us about yourself' }}
      </h1>
      <p class="text-center text-body-sm text-foreground-2 mb-8">
        {{
          currentStage === 'join'
            ? 'We found a workspace that matches your email domain'
            : 'Your answers will help us improve'
        }}
      </p>

      <OnboardingJoinTeammates
        v-if="currentStage === 'join' && hasDiscoverableWorkspaces"
        :workspaces="discoverableWorkspaces || []"
        @next="currentStage = 'questions'"
      />
      <OnboardingQuestionsForm v-else />
    </div>
  </HeaderWithEmptyPage>
</template>

<script setup lang="ts">
import { useProcessOnboarding } from '~~/lib/auth/composables/onboarding'
import { useAuthManager } from '~/lib/auth/composables/auth'
import { CommonLoadingIcon } from '@speckle/ui-components'
import { useDiscoverableWorkspaces } from '~/lib/workspaces/composables/discoverableWorkspaces'

useHead({
  title: 'Welcome to Speckle'
})

definePageMeta({
  middleware: ['auth'],
  layout: 'empty'
})

const isOnboardingForced = useIsOnboardingForced()

const { setUserOnboardingComplete } = useProcessOnboarding()
const { logout } = useAuthManager()

const isLoading = ref(true)
const currentStage = ref<'join' | 'questions'>('questions')
const isWorkspacesEnabled = useIsWorkspacesEnabled()

// Use the composable instead of direct query
const { discoverableWorkspaces, hasDiscoverableWorkspaces } =
  useDiscoverableWorkspaces()

onMounted(async () => {
  // If workspaces feature is disabled, go straight to questions
  if (!isWorkspacesEnabled.value) {
    currentStage.value = 'questions'
    isLoading.value = false
    return
  }

  // Short delay to allow the composable to fetch data
  await nextTick()

  currentStage.value = hasDiscoverableWorkspaces.value ? 'join' : 'questions'
  isLoading.value = false
})
</script>
