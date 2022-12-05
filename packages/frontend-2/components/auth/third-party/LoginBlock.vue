<template>
  <div>
    <div class="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
      <Component
        :is="getButtonComponent(strat)"
        v-for="strat in thirdPartyStrategies"
        :key="strat.id"
        :to="buildAuthUrl(strat)"
        @click="() => onClick(strat)"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { Get } from 'type-fest'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import { AuthStrategy } from '~~/lib/auth/helpers/strategies'
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
  public: { apiOrigin }
} = useRuntimeConfig()
const mixpanel = useMixpanel()
const { inviteToken } = useAuthManager()

const NuxtLink = resolveComponent('NuxtLink')
const GoogleButton = resolveComponent('AuthThirdPartyLoginButtonGoogle')
const MicrosoftButton = resolveComponent('AuthThirdPartyLoginButtonMicrosoft')
const GithubButton = resolveComponent('AuthThirdPartyLoginButtonGithub')

const thirdPartyStrategies = computed(() =>
  props.serverInfo.authStrategies.filter((s) => s.id !== AuthStrategy.Local)
)

const buildAuthUrl = (strat: StrategyType) => {
  const url = new URL(strat.url, apiOrigin)
  url.searchParams.set('appId', props.appId)
  url.searchParams.set('challenge', props.challenge)
  return url.toString()
}

const getButtonComponent = (strat: StrategyType) => {
  const stratId = strat.id as AuthStrategy
  switch (stratId) {
    case AuthStrategy.Google:
      return GoogleButton
    case AuthStrategy.Github:
      return GithubButton
    case AuthStrategy.AzureAD:
      return MicrosoftButton
  }

  return NuxtLink
}

const onClick = (strat: StrategyType) => {
  mixpanel.track('Log In', {
    isInvite: !!inviteToken.value,
    type: 'action',
    provider: strat.name
  })
}
</script>
