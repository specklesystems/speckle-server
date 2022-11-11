<template>
  <LayoutPanel class="mx-auto max-w-screen-md">
    <template #header>Sign in with</template>
    <template #default>
      <div class="flex flex-col space-y-8">
        <FormButton
          v-for="strat in thirdPartyStrategies"
          :key="strat.id"
          :to="buildAuthUrl(strat)"
          type="danger"
          full-width
        >
          {{ strat.name }}
        </FormButton>
      </div>
    </template>
  </LayoutPanel>
</template>
<script setup lang="ts">
import { Get } from 'type-fest'
import { localStrategyId } from '~~/lib/auth/helpers/strategies'
import { graphql } from '~~/lib/common/generated/gql'
import { AuthStategiesServerInfoFragmentFragment } from '~~/lib/common/generated/gql/graphql'

/**
 * TODO:
 * - Color & icon from backend? Or frontend map? Makes more sense being a frontend concern
 * - Mixpanel track
 * - Invite token
 */

type StrategyType = Get<AuthStategiesServerInfoFragmentFragment, 'authStrategies.0'>

graphql(`
  fragment AuthStategiesServerInfoFragment on ServerInfo {
    authStrategies {
      id
      name
      url
    }
  }
`)

const props = defineProps<{
  serverInfo: AuthStategiesServerInfoFragmentFragment
  challenge: string
  appId: string
}>()

const {
  public: { API_ORIGIN }
} = useRuntimeConfig()

const thirdPartyStrategies = computed(() =>
  props.serverInfo.authStrategies.filter((s) => s.id !== localStrategyId)
)

const buildAuthUrl = (strat: StrategyType) => {
  const url = new URL(strat.url, API_ORIGIN)
  url.searchParams.set('appId', props.appId)
  url.searchParams.set('challenge', props.challenge)
  return url.toString()
}
</script>
