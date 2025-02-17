<template>
  <div class="flex flex-col gap-3">
    <Component
      :is="getButtonComponent(strat)"
      v-for="strat in thirdPartyStrategies"
      :key="strat.id"
      to="javascript:;"
      :server-info="serverInfo"
      @click="() => onClick(strat)"
    />
  </div>
</template>
<script setup lang="ts">
import type { Get } from 'type-fest'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import { AuthStrategy } from '~~/lib/auth/helpers/strategies'
import { graphql } from '~~/lib/common/generated/gql'
import type { AuthStategiesServerInfoFragmentFragment } from '~~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~~/lib/core/composables/mp'

/**
 * TODO:
 * - Invite token
 */

type StrategyType = NonNullable<
  Get<AuthStategiesServerInfoFragmentFragment, 'authStrategies.0'>
>

graphql(`
  fragment AuthStategiesServerInfoFragment on ServerInfo {
    authStrategies {
      id
      name
      url
    }
    ...AuthThirdPartyLoginButtonOIDC_ServerInfo
  }
`)

const props = defineProps<{
  serverInfo: AuthStategiesServerInfoFragmentFragment
  challenge: string
  appId: string
  newsletterConsent: boolean
}>()

const apiOrigin = useApiOrigin()
const mixpanel = useMixpanel()
const { inviteToken } = useAuthManager()

const NuxtLink = resolveComponent('NuxtLink')
const GoogleButton = resolveComponent('AuthThirdPartyLoginButtonGoogle')
const MicrosoftButton = resolveComponent('AuthThirdPartyLoginButtonMicrosoft')
const OIDCButton = resolveComponent('AuthThirdPartyLoginButtonOIDC')
const GithubButton = resolveComponent('AuthThirdPartyLoginButtonGithub')

const thirdPartyStrategies = computed(() =>
  props.serverInfo.authStrategies.filter((s) => s.id !== AuthStrategy.Local)
)

const buildAuthUrl = (strat: StrategyType) => {
  const url = new URL(strat.url, apiOrigin)
  url.searchParams.set('appId', props.appId)
  url.searchParams.set('challenge', props.challenge)

  if (inviteToken.value) {
    url.searchParams.set('token', inviteToken.value)
  }

  if (props.newsletterConsent) {
    url.searchParams.set('newsletter', 'true')
  }

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
    case AuthStrategy.OIDC:
      return OIDCButton
  }

  return NuxtLink
}

const onClick = (strat: StrategyType) => {
  if (!import.meta.client) return

  const redirectUrl = buildAuthUrl(strat)
  mixpanel.track('Log In', {
    isInvite: !!inviteToken.value,
    type: 'action',
    provider: strat.name
  })

  window.location.href = redirectUrl
}
</script>
