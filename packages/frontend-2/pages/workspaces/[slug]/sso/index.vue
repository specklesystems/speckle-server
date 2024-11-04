<template>
  <div>
    <!-- Loading State -->
    <template v-if="isLoading">
      <div class="py-12 flex flex-col items-center gap-2">
        <CommonLoadingIcon />
        <p class="text-body-xs text-foreground-2">Loading workspace details...</p>
      </div>
    </template>

    <template v-else>
      <div class="flex flex-col gap-1">
        <div
          class="bg-foundation max-w-sm mt-12 w-full mx-auto border border-outline-3 rounded-md"
        >
          <div class="border-b border-outline-3 py-3 px-6">
            <h1 class="text-heading">
              Sign in to {{ workspace?.name || 'Workspace' }}
            </h1>
          </div>
          <div class="px-6 py-4">
            <!-- SSO Button -->
            <div v-if="isSsoEnabled">
              <div v-if="workspace?.logo" class="w-16 h-16 mx-auto">
                <img
                  :src="workspace.logo"
                  :alt="workspace?.name"
                  class="w-full h-full object-contain"
                />
              </div>

              <p class="text-body-xs text-foreground mb-3">
                Use your
                <span class="font-medium">{{ ssoProviderName }}</span>
                account to access this workspace
              </p>

              <FormButton
                :disabled="!challenge || !ssoProviderName"
                :icon-left="LockOpenIcon"
                @click="handleContinue"
              >
                Continue with {{ ssoProviderName }} SSO
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
                <p class="text-body-2xs">
                  Please contact your workspace administrator.
                </p>
              </div>
            </div>
          </div>

          <!-- Help Text -->
          <div class="px-6 py-3 border-t border-outline-3 select-none">
            <p class="text-body-2xs text-foreground-3">
              Having trouble? Contact your workspace administrator
            </p>
          </div>
        </div>
        <AuthRegisterTerms :server-info="serverInfo" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAuthManager, useLoginOrRegisterUtils } from '~/lib/auth/composables/auth'
import { ExclamationTriangleIcon, LockOpenIcon } from '@heroicons/vue/24/outline'
import { CommonLoadingIcon } from '@speckle/ui-components'
import { useQuery } from '@vue/apollo-composable'
import { authRegisterPanelQuery } from '~/lib/auth/graphql/queries'
import type { ServerTermsOfServicePrivacyPolicyFragmentFragment } from '~/lib/common/generated/gql/graphql'

definePageMeta({
  layout: 'login-or-register',
  middleware: ['requires-workspaces-enabled']
})

const apiOrigin = useApiOrigin()
const route = useRoute()
const { challenge } = useLoginOrRegisterUtils()
const { signInOrSignUpWithSso } = useAuthManager()
const isSsoEnabled = useIsWorkspacesSsoEnabled()

const { result } = useQuery(authRegisterPanelQuery, {
  token: route.query.token as string
})

const serverInfo = computed<ServerTermsOfServicePrivacyPolicyFragmentFragment>(
  () => result.value?.serverInfo || { termsOfService: '' }
)

const workspace = ref<LimitedWorkspace>()
const ssoProviderName = ref<string>()
const isLoading = ref(true)

const handleContinue = () => {
  signInOrSignUpWithSso({
    challenge: challenge.value,
    workspaceSlug: route.params.slug.toString()
  })
}

type LimitedWorkspace = {
  name: string
  logo?: string | null
  defaultLogoIndex: number
  ssoProviderName?: string | null
}

onMounted(() => {
  fetch(new URL(`/api/v1/workspaces/${route.params.slug}/sso`, apiOrigin))
    .then((res) => res.json())
    .then((data: LimitedWorkspace) => {
      workspace.value = data
      ssoProviderName.value = data.ssoProviderName || undefined
    })
    .finally(() => {
      isLoading.value = false
    })
})
</script>
