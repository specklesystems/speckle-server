<template>
  <LayoutPanel class="max-w-2xl mx-auto w-full">
    <div class="space-y-8">
      <h1 class="h4 sm:h3 text-center">Log into my account</h1>
      <AuthThirdPartyLoginBlock
        v-if="serverInfo"
        :server-info="serverInfo"
        :challenge="challenge"
        :app-id="appId"
      />
      <div>
        <div class="text-center label text-foreground-2 mb-3">
          Or login with your email
        </div>
        <AuthLoginWithEmailBlock v-if="hasLocalStrategy" :challenge="challenge" />
      </div>
    </div>
  </LayoutPanel>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import { AuthStrategy } from '~~/lib/auth/helpers/strategies'
import { useLoginOrRegisterUtils } from '~~/lib/auth/composables/auth'

const loginQuery = graphql(`
  query LoginServerInfo {
    serverInfo {
      ...AuthStategiesServerInfoFragment
    }
  }
`)
const { result } = useQuery(loginQuery)
const { appId, challenge } = useLoginOrRegisterUtils()

const serverInfo = computed(() => result.value?.serverInfo)
const hasLocalStrategy = computed(() =>
  (serverInfo.value?.authStrategies || []).some((s) => s.id === AuthStrategy.Local)
)
</script>
