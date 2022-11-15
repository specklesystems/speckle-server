<template>
  <div class="space-y-4">
    <AuthLoginThirdPartyPanel
      v-if="serverInfo"
      :server-info="serverInfo"
      :challenge="challenge"
      :app-id="appId"
    />
    <AuthLoginWithEmailPanel v-if="hasLocalStrategy" :challenge="challenge" />
    <div class="w-full text-center">
      <TextLink :to="ForgottenPasswordRoute">Forgot your password?</TextLink>
    </div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import { localStrategyId } from '~~/lib/auth/helpers/strategies'
import { useLoginOrRegisterUtils } from '~~/lib/auth/composables/auth'
import { ForgottenPasswordRoute } from '~~/lib/common/helpers/route'

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
  (serverInfo.value?.authStrategies || []).some((s) => s.id === localStrategyId)
)
</script>
