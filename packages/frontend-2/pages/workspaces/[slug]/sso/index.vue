<template>
  <div>
    <!-- Loading State -->
    <template v-if="isLoading">
      <div class="py-12 flex flex-col items-center gap-2">
        <CommonLoadingIcon />
      </div>
    </template>

    <template v-else>
      <div class="flex flex-col gap-1 mt-12">
        <!-- Error Message Banner -->
        <div
          v-if="errorMessage"
          class="bg-highlight-1 border border-outline-3 rounded p-2 mb-2"
        >
          <div class="flex items-center justify-center gap-2">
            <ExclamationTriangleIcon class="w-5 h-5 text-danger" />
            <p class="text-body-2xs text-foreground">{{ errorMessage }}</p>
          </div>
        </div>
        <div
          class="bg-foundation max-w-sm w-full mx-auto border border-outline-3 rounded-md"
        >
          <div
            class="border-b border-outline-3 py-2 px-6 flex justify-start items-center gap-2"
          >
            <div v-if="workspace?.logo" class="w-8 h-8">
              <img
                :src="workspace.logo"
                :alt="workspace?.name"
                class="w-full h-full object-contain rounded-full"
              />
            </div>
            <h1 class="text-heading-sm">
              Sign in to {{ workspace?.name || 'Workspace' }}
            </h1>
          </div>
          <div class="px-6 py-4">
            <!-- SSO Button -->
            <div v-if="isSsoEnabled">
              <p class="text-body-xs text-foreground leading-5 mb-3">
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
import { LockOpenIcon } from '@heroicons/vue/24/outline'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid'
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
const logger = useLogger()
const { challenge } = useLoginOrRegisterUtils()
const { signInOrSignUpWithSso } = useAuthManager()
const isSsoEnabled = useIsWorkspacesSsoEnabled()
const isPostSsoFlow = computed(() => !!route.query.access_code)

const { result } = useQuery(authRegisterPanelQuery, {
  token: route.query.token as string
})

const serverInfo = computed<ServerTermsOfServicePrivacyPolicyFragmentFragment>(
  () => result.value?.serverInfo || { termsOfService: '' }
)

const workspace = ref<LimitedWorkspace>()
const ssoProviderName = ref<string>()
const isLoading = ref(true)

const errorMessage = computed(() => {
  const error = route.query.error as string | undefined
  if (!error) return null

  // Convert URL-friendly error to readable message
  return decodeURIComponent(error).replace(/\+/g, ' ').trim()
})

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

onMounted(async () => {
  if (isPostSsoFlow.value) {
    return
  }
  try {
    const res = await fetch(
      new URL(`/api/v1/workspaces/${route.params.slug}/sso`, apiOrigin)
    )
    const data: LimitedWorkspace = (await res.json()) as LimitedWorkspace
    workspace.value = data
    ssoProviderName.value = data.ssoProviderName || undefined
  } catch (error) {
    logger.error('Failed to fetch workspace data:', error)
  } finally {
    isLoading.value = false
  }
})
</script>
