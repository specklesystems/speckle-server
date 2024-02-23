<template>
  <LayoutPanel fancy-glow no-shadow class="max-w-lg mx-auto w-full">
    <div class="space-y-4">
      <div class="flex flex-col items-center sm:gap-2">
        <h1
          class="text-xl sm:text-3xl text-center font-bold bg-gradient-to-r py-1 from-blue-500 via-blue-400 to-blue-600 inline-block text-transparent bg-clip-text"
        >
          Create your Speckle Account
        </h1>
        <h2 class="text-sm sm:text-base text-center text-foreground-2">
          Interoperability, Collaboration and Automation for 3D
        </h2>
      </div>
      <template v-if="isInviteOnly && !inviteToken">
        <div class="flex space-x-2 items-center">
          <ExclamationTriangleIcon class="h-8 w-8 text-warning" />
          <div>
            This server is invite only. If you have received an invitation email, please
            follow the instructions in it.
          </div>
        </div>
        <div class="flex space-x-2 items-center justify-center">
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
        />
        <div>
          <div
            v-if="hasThirdPartyStrategies && hasLocalStrategy"
            class="text-center label text-foreground-2 mb-3 text-xs font-normal"
          >
            Or sign up with your email
          </div>
          <AuthRegisterWithEmailBlock
            v-if="serverInfo && hasLocalStrategy"
            :challenge="challenge"
            :server-info="serverInfo"
            :invite-email="inviteEmail"
          />
        </div>
      </template>
    </div>
  </LayoutPanel>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { AuthStrategy } from '~~/lib/auth/helpers/strategies'
import { useLoginOrRegisterUtils } from '~~/lib/auth/composables/auth'
import { loginServerInfoQuery } from '~~/lib/auth/graphql/queries'
import { graphql } from '~~/lib/common/generated/gql'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { loginRoute } from '~~/lib/common/helpers/route'

graphql(`
  fragment AuthRegisterPanelServerInfo on ServerInfo {
    inviteOnly
  }
`)

const serverInviteQuery = graphql(`
  query RegisterPanelServerInvite($token: String!) {
    serverInviteByToken(token: $token) {
      id
      email
    }
  }
`)

const newsletterConsent = ref(false)

provide('newsletterconsent', newsletterConsent)

const { result } = useQuery(loginServerInfoQuery)
const { appId, challenge, inviteToken } = useLoginOrRegisterUtils()
const { result: inviteMetadata } = useQuery(
  serverInviteQuery,
  () => ({ token: inviteToken.value || '' }),
  {
    enabled: computed(() => !!inviteToken.value?.length)
  }
)

const inviteEmail = computed(() => inviteMetadata.value?.serverInviteByToken?.email)
const serverInfo = computed(() => result.value?.serverInfo)
const hasLocalStrategy = computed(() =>
  (serverInfo.value?.authStrategies || []).some((s) => s.id === AuthStrategy.Local)
)

const hasThirdPartyStrategies = computed(() =>
  (serverInfo.value?.authStrategies || []).some((s) => s.id !== AuthStrategy.Local)
)

const isInviteOnly = computed(() => !!serverInfo.value?.inviteOnly)
</script>
