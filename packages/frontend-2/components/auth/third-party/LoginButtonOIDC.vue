<template>
  <AuthThirdPartyLoginButtonBase :to="to" class="dark:bg-[#2F2F2F]">
    <IdentificationIcon class="h-4" />
    <div class="ml-3">{{ oidcName }}</div>
  </AuthThirdPartyLoginButtonBase>
</template>
<script setup lang="ts">
import { IdentificationIcon } from '@heroicons/vue/24/outline'
import { useQuery } from '@vue/apollo-composable'
import { loginServerInfoQuery } from '~~/lib/auth/graphql/queries'

defineProps<{
  to: string
}>()

const { result } = useQuery(loginServerInfoQuery)
const authStrategies = computed(() => result.value?.serverInfo.authStrategies)

const oidcName = computed(() => {
  const oidcStrategy = authStrategies.value?.find((strategy) => strategy.id === 'oidc')
  return oidcStrategy ? oidcStrategy.name : 'Log in'
})
</script>
