<template>
  <div class="--mx-auto w-full">
    <div class="space-y-6">
      <div v-if="!workspaceInvite" class="flex flex-col items-center gap-y-2">
        <h1 class="text-heading-xl text-center inline-block">
          Create your Speckle account
        </h1>
        <h2 class="text-body-sm text-center text-foreground-2">
          Connectivity, Collaboration and Automation for 3D
        </h2>
      </div>
      <AuthWorkspaceInviteHeader v-else :invite="workspaceInvite" />
      <template v-if="isInviteOnly && !inviteToken">
        <div class="flex space-x-2 items-center">
          <ExclamationTriangleIcon class="h-8 w-8 text-warning" />
          <div>
            This server is invite only. If you have received an invitation email, please
            follow the instructions in it.
          </div>
        </div>
        <div v-if="!inviteEmail" class="flex space-x-2 items-center justify-center">
          <span>Already have an account?</span>
          <CommonTextLink :to="loginRoute">Log in</CommonTextLink>
        </div>
      </template>
      <template v-else>
        <AuthThirdPartyLoginBlock
          v-if="serverInfo && hasThirdPartyStrategies"
          :server-info="serverInfo"
          :challenge="challenge"
          :app-id="appId"
          :newsletter-consent="newsletterConsent"
        />
        <div>
          <div
            v-if="hasThirdPartyStrategies && hasLocalStrategy"
            class="text-center text-foreground-2 mb-3 text-body-2xs font-normal"
          >
            Or sign up with your email
          </div>
          <AuthRegisterWithEmailBlock
            v-if="serverInfo && hasLocalStrategy"
            v-model:newsletter-consent="newsletterConsent"
            :challenge="challenge"
            :server-info="serverInfo"
            :invite-email="inviteEmail"
          />
        </div>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { AuthStrategy } from '~~/lib/auth/helpers/strategies'
import { useLoginOrRegisterUtils } from '~~/lib/auth/composables/auth'
import { graphql } from '~~/lib/common/generated/gql'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { loginRoute } from '~~/lib/common/helpers/route'

const registerPanelQuery = graphql(`
  query AuthRegisterPanel($token: String) {
    serverInfo {
      inviteOnly
      authStrategies {
        id
      }
      ...AuthStategiesServerInfoFragment
      ...ServerTermsOfServicePrivacyPolicyFragment
    }
    serverInviteByToken(token: $token) {
      id
      email
    }
  }
`)

const registerPanelWorkspaceInviteQuery = graphql(`
  query AuthRegisterPanelWorkspaceInvite($token: String) {
    workspaceInvite(token: $token) {
      id
      ...AuthWorkspaceInviteHeader_PendingWorkspaceCollaborator
    }
  }
`)

const isWorkspacesEnabled = useIsWorkspacesEnabled()
const { appId, challenge, inviteToken } = useLoginOrRegisterUtils()
const { result } = useQuery(registerPanelQuery, () => ({
  token: inviteToken.value
}))
const { result: workspaceInviteResult } = useQuery(
  registerPanelWorkspaceInviteQuery,
  () => ({
    token: inviteToken.value
  }),
  () => ({
    enabled: isWorkspacesEnabled.value
  })
)

const newsletterConsent = ref(false)

const inviteEmail = computed(() => result.value?.serverInviteByToken?.email)
const serverInfo = computed(() => result.value?.serverInfo)
const hasLocalStrategy = computed(() =>
  (serverInfo.value?.authStrategies || []).some((s) => s.id === AuthStrategy.Local)
)

const hasThirdPartyStrategies = computed(() =>
  (serverInfo.value?.authStrategies || []).some((s) => s.id !== AuthStrategy.Local)
)

const isInviteOnly = computed(() => !!serverInfo.value?.inviteOnly)
const workspaceInvite = computed(() => workspaceInviteResult.value?.workspaceInvite)
</script>
