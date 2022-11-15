<template>
  <LayoutPanel class="mx-auto max-w-screen-md">
    <template #header>Sign in with</template>
    <template #default>
      <div class="flex flex-col space-y-8">
        <FormButton
          v-for="strat in thirdPartyStrategies"
          :key="strat.id"
          :to="buildAuthUrl(strat)"
          :type="buttonType(strat)"
          full-width
          @click="() => onClick(strat)"
        >
          {{ strat.name }}
        </FormButton>
      </div>
    </template>
  </LayoutPanel>
</template>
<script setup lang="ts">
import { Get } from 'type-fest'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import { AuthStrategy, AuthStrategyStyles } from '~~/lib/auth/helpers/strategies'
import { graphql } from '~~/lib/common/generated/gql'
import { AuthStategiesServerInfoFragmentFragment } from '~~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~~/lib/core/composables/mixpanel'

/**
 * TODO:
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
const mixpanel = useMixpanel()
const { inviteToken } = useAuthManager()

const thirdPartyStrategies = computed(() =>
  props.serverInfo.authStrategies.filter((s) => s.id !== AuthStrategy.Local)
)

const buildAuthUrl = (strat: StrategyType) => {
  const url = new URL(strat.url, API_ORIGIN)
  url.searchParams.set('appId', props.appId)
  url.searchParams.set('challenge', props.challenge)
  return url.toString()
}

const buttonType = (strat: StrategyType) => {
  const stratId = strat.id as AuthStrategy
  const styleData = AuthStrategyStyles[stratId]
  return styleData?.buttonType || 'primary'
}

const onClick = (strat: StrategyType) => {
  mixpanel.track('Log In', {
    isInvite: !!inviteToken.value,
    type: 'action',
    provider: strat.name
  })
}
</script>
