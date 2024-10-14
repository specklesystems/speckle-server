<template>
  <AuthThirdPartyLoginButtonBase :to="to" class="dark:bg-[#2F2F2F]">
    <IdentificationIcon class="h-4" />
    <div class="ml-3">{{ oidcName }}</div>
  </AuthThirdPartyLoginButtonBase>
</template>
<script setup lang="ts">
import { IdentificationIcon } from '@heroicons/vue/24/outline'
import { graphql } from '~/lib/common/generated/gql'
import type { AuthThirdPartyLoginButtonOidc_ServerInfoFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment AuthThirdPartyLoginButtonOIDC_ServerInfo on ServerInfo {
    authStrategies {
      id
      name
    }
  }
`)

const props = defineProps<{
  to: string
  serverInfo: AuthThirdPartyLoginButtonOidc_ServerInfoFragment
}>()

const authStrategies = computed(() => props.serverInfo.authStrategies)

const oidcName = computed(() => {
  const oidcStrategy = authStrategies.value?.find((strategy) => strategy.id === 'oidc')
  return oidcStrategy ? oidcStrategy.name : 'Log in'
})
</script>
