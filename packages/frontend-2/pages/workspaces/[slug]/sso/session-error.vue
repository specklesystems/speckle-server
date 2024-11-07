<template>
  <div class="max-w-md mx-auto flex flex-col items-center gap-4">
    <div v-if="loading">
      <CommonLoadingIcon />
    </div>
    <template v-else>
      <div v-if="workspace?.logo" class="w-16 h-16 mb-2">
        <img
          :src="workspace.logo"
          :alt="workspace?.name"
          class="w-full h-full object-contain rounded-full"
        />
      </div>
      <h1 class="text-heading-xl">SSO Required for {{ workspace?.name }}</h1>
      <div
        class="p-4 rounded-lg border border-outline-2 bg-foundation text-body-xs mb-4"
      >
        <p class="font-medium mb-2 text-foreground">
          This workspace requires Single Sign-On (SSO) authentication.
        </p>
        <p class="text-foreground-2">
          While you are a member, you need to sign in using your organization's SSO to
          access it.
        </p>
      </div>
      <FormButton @click="handleLoginRedirect">Logout and sign in with SSO</FormButton>
    </template>
  </div>
</template>

<script setup lang="ts">
import { CommonLoadingIcon } from '@speckle/ui-components'
import { useAuthManager } from '~/lib/auth/composables/auth'
import { ssoLoginRoute } from '~/lib/common/helpers/route'
import { useMixpanel } from '~/lib/core/composables/mp'
import { useWorkspaceSsoPublic } from '~/lib/workspaces/composables/management'

const route = useRoute()
const router = useRouter()
const logger = useLogger()
const { logout } = useAuthManager()
const mixpanel = useMixpanel()

const workspaceSlug = route.params.slug as string
const { workspace, loading, error } = useWorkspaceSsoPublic(workspaceSlug)

if (error.value) {
  logger.error('Failed to fetch workspace data:', error.value)
}

const handleLoginRedirect = async () => {
  mixpanel.track('Workspace SSO Session Error Redirect', {
    // eslint-disable-next-line camelcase
    workspace_slug: workspaceSlug,
    // eslint-disable-next-line camelcase
    provider_name: workspace.value?.ssoProviderName
  })

  await logout({ skipRedirect: true })
  router.push(ssoLoginRoute)
}
</script>
