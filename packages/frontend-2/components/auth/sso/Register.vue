<template>
  <div class="flex flex-col items-center gap-4">
    <WorkspaceAvatar
      v-if="workspace"
      :logo="workspace.logo"
      :default-logo-index="workspace.defaultLogoIndex"
      size="xl"
    />

    <h1 class="text-heading-xl text-center">
      Sign up to access {{ workspace?.name || 'your Workspace' }}
    </h1>

    <div class="w-full max-w-xs">
      <AuthRegisterNewsletter v-model:newsletter-consent="newsletterConsent" />

      <div class="my-4">
        <FormButton
          size="lg"
          full-width
          :loading="loading"
          :disabled="loading"
          @click="handleContinue"
        >
          Continue with {{ workspace?.ssoProviderName || 'SSO' }}
        </FormButton>
      </div>
      <AuthRegisterTerms v-if="serverInfo" :server-info="serverInfo" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthManager, useLoginOrRegisterUtils } from '~/lib/auth/composables/auth'
import { useWorkspacePublicSsoCheck } from '~/lib/workspaces/composables/sso'
import { useMixpanel } from '~/lib/core/composables/mp'
import { authRegisterPanelQuery } from '~/lib/auth/graphql/queries'
import { useQuery } from '@vue/apollo-composable'

const route = useRoute()
const loading = ref(false)
const newsletterConsent = ref<true | undefined>(undefined)

const { challenge } = useLoginOrRegisterUtils()
const { signInOrSignUpWithSso } = useAuthManager()
const mixpanel = useMixpanel()
const logger = useLogger()
const { result } = useQuery(authRegisterPanelQuery)

const serverInfo = computed(() => result.value?.serverInfo)
const workspaceSlug = computed(() => route.params.slug?.toString() || '')
const { workspace } = useWorkspacePublicSsoCheck(workspaceSlug)

const handleContinue = () => {
  if (!workspaceSlug.value) return

  loading.value = true
  try {
    mixpanel.track('Workspace SSO Register Attempted', {
      // eslint-disable-next-line camelcase
      workspace_slug: workspaceSlug.value
    })

    signInOrSignUpWithSso({
      challenge: challenge.value,
      workspaceSlug: workspaceSlug.value,
      newsletterConsent: !!newsletterConsent.value
    })
  } catch (error) {
    logger.error('SSO registration failed:', error)
    mixpanel.track('Workspace SSO Registration Failed', {
      // eslint-disable-next-line camelcase
      workspace_slug: workspaceSlug.value
    })
  } finally {
    loading.value = false
    mixpanel.track('Workspace SSO Registration Successful', {
      // eslint-disable-next-line camelcase
      workspace_slug: workspaceSlug.value
    })
  }
}
</script>
