<template>
  <HeaderWithEmptyPage empty-header>
    <template #header-left>
      <HeaderLogoBlock no-link />
    </template>
    <template #header-right>
      <div class="flex gap-2 items-center">
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
            ? 'We found a workspace that matches your email domain'
            : 'Your answers will help us improve'
        }}
      </p>

      <template v-if="!loading">
        <OnboardingJoinTeammates
          v-if="currentStage === 'join' && discoverableWorkspaces.length > 0"
          :workspaces="discoverableWorkspaces"
          @next="currentStage = 'questions'"
        />
        <OnboardingQuestionsForm v-else />
      </template>
      <CommonLoadingIcon v-else size="lg" />
    </div>
  </HeaderWithEmptyPage>
</template>

<script setup lang="ts">
import { useProcessOnboarding } from '~~/lib/auth/composables/onboarding'
import { useAuthManager } from '~/lib/auth/composables/auth'
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { CommonLoadingIcon } from '@speckle/ui-components'

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

const { createOnboardingProject } = useProcessOnboarding()
const { activeUser } = useActiveUser()
const { logout } = useAuthManager()

const { result, loading } = useQuery(discoverableWorkspacesQuery)

const currentStage = ref<'join' | 'questions'>('join')

const discoverableWorkspaces = computed(
  () => result.value?.activeUser?.discoverableWorkspaces || []
)

watch(
  loading,
  (isLoading) => {
    if (!isLoading && discoverableWorkspaces.value.length === 0) {
      currentStage.value = 'questions'
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (activeUser.value?.versions.totalCount === 0) {
    createOnboardingProject()
  }
})
</script>
