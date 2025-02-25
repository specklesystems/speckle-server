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
        v-if="currentStage === 'join' && discoverableWorkspaces.length > 0"
        :workspaces="discoverableWorkspaces"
        @next="currentStage = 'questions'"
      />
      <OnboardingQuestionsForm v-else />
    </div>
  </HeaderWithEmptyPage>
</template>

<script setup lang="ts">
import { useProcessOnboarding } from '~~/lib/auth/composables/onboarding'
import { useAuthManager } from '~/lib/auth/composables/auth'
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import { CommonLoadingIcon } from '@speckle/ui-components'
import { PagesOnboardingDiscoverableWorkspaces } from '~/lib/onboarding/graphql/queries'
import { until } from '@vueuse/core'

graphql(`
  fragment PagesOnboarding_DiscoverableWorkspaces on User {
    discoverableWorkspaces {
      id
      name
      logo
      description
      slug
    }
  }
`)

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

const { result, loading } = useQuery(PagesOnboardingDiscoverableWorkspaces, undefined, {
  enabled: isWorkspacesEnabled.value
})

const discoverableWorkspaces = computed(
  () => result.value?.activeUser?.discoverableWorkspaces || []
)

onMounted(async () => {
  // If workspaces feature is disabled, go straight to questions
  if (!isWorkspacesEnabled.value) {
    currentStage.value = 'questions'
    isLoading.value = false
    return
  }

  // Wait for query to complete
  await until(loading).toBe(false)
  const hasWorkspaces =
    (result.value?.activeUser?.discoverableWorkspaces?.length ?? 0) > 0
  currentStage.value = hasWorkspaces ? 'join' : 'questions'
  isLoading.value = false
})
</script>
