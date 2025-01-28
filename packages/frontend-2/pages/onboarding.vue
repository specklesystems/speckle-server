<template>
  <HeaderWithEmptyPage show-logo :logo-link="false">
    <template #header-actions>
      <div class="flex gap-2 items-center">
        <FormButton
          class="opacity-70 hover:opacity-100 p-1"
          size="sm"
          color="subtle"
          @click="setUserOnboardingComplete"
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
        {{ currentStage === 'join' ? 'Join your teammates' : 'Tell us about yourself' }}
      </h1>
      <p class="text-center text-body-sm text-foreground-2 mb-8">
        {{
          currentStage === 'join'
            ? 'Find your team on Speckle'
            : 'Your answers will help us improve'
        }}
      </p>
      <OnboardingJoinTeammates
        v-if="currentStage === 'join' && discoverableWorkspaces?.length"
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
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

const discoverableWorkspacesQuery = graphql(`
  query DiscoverableWorkspaces {
    activeUser {
      discoverableWorkspaces {
        id
        name
        logo
        description
        slug
      }
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

const { setUserOnboardingComplete, createOnboardingProject } = useProcessOnboarding()
const { activeUser } = useActiveUser()
const { logout } = useAuthManager()

const { result } = useQuery(discoverableWorkspacesQuery)

const discoverableWorkspaces = computed(
  () => result.value?.activeUser?.discoverableWorkspaces || []
)

const currentStage = ref<'join' | 'questions'>(
  discoverableWorkspaces.value ? 'join' : 'questions'
)

onMounted(() => {
  if (activeUser.value?.versions.totalCount === 0) {
    createOnboardingProject()
  }
})
</script>
