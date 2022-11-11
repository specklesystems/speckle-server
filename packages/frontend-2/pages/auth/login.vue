<template>
  <div class="space-y-4">
    <AuthLoginThirdPartyPanel
      v-if="serverInfo"
      :server-info="serverInfo"
      :challenge="challenge"
      :app-id="appId"
    />
    <AuthLoginWithEmailPanel v-if="hasLocalStrategy" :challenge="challenge" />
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import { localStrategyId, speckleWebAppId } from '~~/lib/auth/helpers/strategies'
import { Optional, SafeLocalStorage } from '@speckle/shared'
import { randomString } from '~~/lib/common/helpers/random'
import { LocalStorageKeys } from '~~/lib/common/helpers/constants'

const loginQuery = graphql(`
  query LoginServerInfo {
    serverInfo {
      ...AuthStategiesServerInfoFragment
    }
  }
`)
const route = useRoute()
const { result } = useQuery(loginQuery)

const appId = ref('')
const challenge = ref('')

const serverInfo = computed(() => result.value?.serverInfo)
const hasLocalStrategy = computed(() =>
  (serverInfo.value?.authStrategies || []).some((s) => s.id === localStrategyId)
)

onMounted(() => {
  // Resolve challenge & appId from querystring or generate them
  const queryChallenge = route.query.challenge as Optional<string>
  const queryAppId = route.query.appId as Optional<string>

  appId.value = queryAppId || speckleWebAppId

  if (queryChallenge) {
    challenge.value = queryChallenge
  } else if (appId.value === speckleWebAppId) {
    const newChallenge = randomString(10)

    SafeLocalStorage.set(LocalStorageKeys.AuthAppChallenge, newChallenge)
    challenge.value = newChallenge
  }
})
</script>
