<template>
  <div class="flex flex-col items-center">
    <LogoTextWhite class="my-6 sm:mb-14" />
    <LayoutPanel class="max-w-screen-sm mx-auto w-full">
      <div class="space-y-8">
        <h1 class="h4 sm:h3 font-bold leading-9 text-center">
          Interoperability in seconds
        </h1>
        <template v-if="isInviteOnly && !inviteToken">
          <div class="flex space-x-2 items-center">
            <ExclamationTriangleIcon class="h-8 w-8 text-warning" />
            <div>
              This server is invite only. If you have received an invitation email,
              please follow the instructions in it.
            </div>
          </div>
          <div class="flex space-x-2 items-center justify-center">
            <span>Already have an account?</span>
            <CommonTextLink :to="loginRoute">Log in</CommonTextLink>
          </div>
        </template>
        <template v-else>
          <AuthThirdPartyLoginBlock
            v-if="serverInfo"
            :server-info="serverInfo"
            :challenge="challenge"
            :app-id="appId"
          />
          <div>
            <div class="text-center label text-foreground-2 mb-3">
              Or sign up with your email
            </div>
            <AuthRegisterWithEmailBlock
              v-if="serverInfo && hasLocalStrategy"
              :challenge="challenge"
              :server-info="serverInfo"
            />
          </div>
        </template>
      </div>
    </LayoutPanel>
  </div>
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

const { result } = useQuery(loginServerInfoQuery)
const { appId, challenge, inviteToken } = useLoginOrRegisterUtils()

const serverInfo = computed(() => result.value?.serverInfo)
const hasLocalStrategy = computed(() =>
  (serverInfo.value?.authStrategies || []).some((s) => s.id === AuthStrategy.Local)
)
const isInviteOnly = computed(() => !!serverInfo.value?.inviteOnly)
</script>
