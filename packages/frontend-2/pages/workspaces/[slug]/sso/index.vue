<template>
  <div>
    <template v-if="loading || isAuthenticating">
      <div class="py-12 flex flex-col items-center gap-2">
        <CommonLoadingIcon />
        <p v-if="isAuthenticating" class="text-body-xs text-foreground-2">
          Completing authentication...
        </p>
      </div>
    </template>

    <template v-else>
      <div class="flex flex-col items-center gap-2 mt-8">
        <WorkspaceAvatar
          v-if="workspace"
          :logo="workspace.logo"
          :default-logo-index="workspace.defaultLogoIndex"
          size="xl"
        />
        <h1 class="text-heading-xl mb-2">
          {{ !isSsoAuthenticated ? 'Sign in to' : '' }}
          {{ workspace?.name || 'Workspace' }}
        </h1>

        <div v-if="errorMessage" class="border border-outline-3 rounded p-4 mb-2">
          <p class="text-body-2xs text-foreground">{{ errorMessage }}</p>
        </div>

        <div v-if="isSsoAuthenticated" class="border border-outline-3 rounded p-4 mb-2">
          <p class="text-body-xs text-foreground">
            You already have a valid SSO session for this workspace.
          </p>
        </div>

        <div v-else-if="isSsoEnabled" class="flex flex-col gap-4">
          <FormButton
            :disabled="!challenge || !workspace?.ssoProviderName"
            @click="handleContinue"
          >
            Continue with {{ workspace?.ssoProviderName }} SSO
          </FormButton>
          <AuthRegisterTerms :server-info="serverInfo" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAuthManager, useLoginOrRegisterUtils } from '~/lib/auth/composables/auth'
import { CommonLoadingIcon } from '@speckle/ui-components'
import { useQuery } from '@vue/apollo-composable'
import { authRegisterPanelQuery } from '~/lib/auth/graphql/queries'
import type { ServerTermsOfServicePrivacyPolicyFragmentFragment } from '~/lib/common/generated/gql/graphql'
import {
  useWorkspaceSsoStatus,
  useWorkspacePublicSsoCheck
} from '~/lib/workspaces/composables/sso'
import { useMixpanel } from '~/lib/core/composables/mp'

definePageMeta({
  layout: 'login-or-register',
  middleware: ['requires-workspaces-enabled', 'require-sso-enabled']
})

const route = useRoute()
const logger = useLogger()
const { challenge } = useLoginOrRegisterUtils()
const { signInOrSignUpWithSso } = useAuthManager()
const isSsoEnabled = useIsWorkspacesSsoEnabled()
const mixpanel = useMixpanel()

const workspaceSlug = computed(() => route.params.slug as string)
const { isSsoAuthenticated } = useWorkspaceSsoStatus({
  workspaceSlug
})

const { result } = useQuery(authRegisterPanelQuery, {
  token: route.query.token as string
})

const { workspace, loading, error } = useWorkspacePublicSsoCheck(workspaceSlug)

const errorState = computed(() => {
  if (error.value) {
    logger.error('Failed to fetch workspace data:', error.value)
    return error.value
  }
  return null
})

const serverInfo = computed<ServerTermsOfServicePrivacyPolicyFragmentFragment>(
  () => result.value?.serverInfo || { termsOfService: '' }
)

const errorMessage = computed(() => {
  // Check for URL error parameter first
  const urlError = route.query.error as string | undefined
  if (urlError) {
    return decodeURIComponent(urlError).replace(/\+/g, ' ').trim()
  }

  // Then check for fetch error
  if (errorState.value) {
    return 'Failed to load workspace information'
  }

  return null
})

const isAuthenticating = computed(() => {
  return !!route.query.access_code
})

const handleContinue = () => {
  mixpanel.track('Workspace SSO Login Attempted', {
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
