<template>
  <div class="--mx-auto w-full">
    <div class="space-y-6">
      <div v-if="!workspaceInvite" class="flex flex-col items-center gap-y-2">
        <h1 class="text-heading-xl text-center inline-block">
          Create your Speckle account
        </h1>
      </div>
      <AuthWorkspaceInviteHeader v-else :invite="workspaceInvite" />
      <template v-if="isInviteOnly && !inviteToken">
        <CommonAlert color="warning">
          <template #title>This server is invite only</template>
          <template #description>
            If you have received an invitation email, please follow the instructions in
            it.
          </template>
        </CommonAlert>
        <div
          v-if="!inviteEmail"
          class="flex gap-1 text-foregound-3 text-body-xs items-center justify-center"
        >
          <span>Already have an account?</span>
          <NuxtLink class="text-foreground" :to="loginRoute">Log in</NuxtLink>
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
import { loginRoute } from '~~/lib/common/helpers/route'
import { authRegisterPanelQuery } from '~/lib/auth/graphql/queries'

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
const { result } = useQuery(authRegisterPanelQuery, () => ({
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
