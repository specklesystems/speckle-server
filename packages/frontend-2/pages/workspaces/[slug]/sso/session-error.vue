<template>
  <div class="max-w-md mx-auto flex flex-col items-center gap-4">
    <div v-if="loading">
      <CommonLoadingIcon />
    </div>
    <template v-else>
      <WorkspaceAvatar
        v-if="workspace"
        :logo="workspace.logo"
        :default-logo-index="workspace.defaultLogoIndex"
        size="xl"
      />
      <h1 class="text-heading-xl">SSO is required for {{ workspace?.name }}</h1>
      <div
        class="p-4 rounded-lg border border-outline-2 bg-foundation text-body-xs mb-2"
      >
        <p class="font-medium mb-2 text-foreground">
          This workspace requires Single Sign-On (SSO) authentication.
        </p>
        <p class="text-foreground-2">
          While you are a member, you need to sign in using your organization's SSO to
          access it.
        </p>
      </div>
      <FormButton size="lg" @click="handleSsoLogin">Sign in with SSO</FormButton>
    </template>
  </div>
</template>

<script setup lang="ts">
import { CommonLoadingIcon } from '@speckle/ui-components'
import { useWorkspacePublicSsoCheck } from '~/lib/workspaces/composables/sso'
import { useMixpanel } from '~/lib/core/composables/mp'
import { useAuthManager, useLoginOrRegisterUtils } from '~/lib/auth/composables/auth'

const route = useRoute()
const logger = useLogger()
const mixpanel = useMixpanel()
const { signInOrSignUpWithSso } = useAuthManager()
const { challenge } = useLoginOrRegisterUtils()

const workspaceSlug = computed(() => route.params.slug as string)
const { workspace, loading, error } = useWorkspacePublicSsoCheck(workspaceSlug)

if (error.value) {
  logger.error('Failed to fetch workspace data:', error.value)
}

const handleSsoLogin = () => {
  mixpanel.track('Workspace SSO Session Error Redirected', {
    // eslint-disable-next-line camelcase
    workspace_slug: workspaceSlug.value,
    // eslint-disable-next-line camelcase
    provider_name: workspace.value?.ssoProviderName
  })

  signInOrSignUpWithSso({
    workspaceSlug: workspaceSlug.value,
    challenge: challenge.value
  })
}
</script>
