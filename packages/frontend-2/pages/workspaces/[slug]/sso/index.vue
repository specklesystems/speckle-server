<template>
  <div>
    <!-- Loading State -->
    <template v-if="loading">
      <div class="py-12 flex flex-col items-center gap-2">
        <CommonLoadingIcon />
      </div>
    </template>

    <template v-else>
      <div class="flex flex-col items-center gap-2 mt-8">
        <NuxtImg
          v-if="workspace?.logo"
          :src="workspace.logo"
          :alt="workspace?.name"
          class="w-16 h-16 object-contain rounded-full"
        />
        <h1 class="text-heading-xl mb-2">
          Sign in to {{ workspace?.name || 'Workspace' }}
        </h1>
        <!-- Error Message Banner -->
        <div v-if="errorMessage" class="border border-outline-3 rounded p-4 mb-2">
          <p class="text-body-2xs text-foreground">{{ errorMessage }}</p>
        </div>
        <div v-if="isSsoEnabled">
          <FormButton
            :disabled="!challenge || !workspace?.ssoProviderName"
            :icon-left="LockOpenIcon"
            @click="handleContinue"
          >
            Continue with {{ workspace?.ssoProviderName }} SSO
          </FormButton>
        </div>

        <!-- Error State -->
        <div
          v-else
          class="flex items-center gap-2 border border-outline-2 bg-foundation-page p-2 rounded"
        >
          <ExclamationTriangleIcon class="w-6 h-6 text-foreground-2" />
          <div>
            <p class="text-body-xs font-medium">
              SSO is not configured for this workspace.
            </p>
            <p class="text-body-2xs">Please contact your workspace administrator.</p>
          </div>
        </div>
        <AuthRegisterTerms :server-info="serverInfo" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAuthManager, useLoginOrRegisterUtils } from '~/lib/auth/composables/auth'
import { LockOpenIcon } from '@heroicons/vue/24/outline'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid'
import { CommonLoadingIcon } from '@speckle/ui-components'
import { useQuery } from '@vue/apollo-composable'
import { authRegisterPanelQuery } from '~/lib/auth/graphql/queries'
import type { ServerTermsOfServicePrivacyPolicyFragmentFragment } from '~/lib/common/generated/gql/graphql'
import { useWorkspaceSsoPublic } from '~/lib/workspaces/composables/management'
import { useMixpanel } from '~/lib/core/composables/mp'

definePageMeta({
  layout: 'login-or-register',
  middleware: ['requires-workspaces-enabled']
})

const route = useRoute()
const logger = useLogger()
const { challenge } = useLoginOrRegisterUtils()
const { signInOrSignUpWithSso } = useAuthManager()
const isSsoEnabled = useIsWorkspacesSsoEnabled()
const mixpanel = useMixpanel()

const { result } = useQuery(authRegisterPanelQuery, {
  token: route.query.token as string
})

const { workspace, loading, error } = useWorkspaceSsoPublic(
  route.params.slug.toString()
)

if (error.value) {
  logger.error('Failed to fetch workspace data:', error.value)
}

const serverInfo = computed<ServerTermsOfServicePrivacyPolicyFragmentFragment>(
  () => result.value?.serverInfo || { termsOfService: '' }
)

const errorMessage = computed(() => {
  const error = route.query.error as string | undefined
  if (!error) return null

  // Convert URL-friendly error to readable message
  return decodeURIComponent(error).replace(/\+/g, ' ').trim()
})

const handleContinue = () => {
  mixpanel.track('Workspace SSO Login Attempt', {
    // eslint-disable-next-line camelcase
    workspace_slug: route.params.slug.toString(),
    // eslint-disable-next-line camelcase
    provider_name: workspace.value?.ssoProviderName
  })
  signInOrSignUpWithSso({
    challenge: challenge.value,
    workspaceSlug: route.params.slug.toString()
  })
}
</script>
