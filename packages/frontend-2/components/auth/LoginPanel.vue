<template>
  <div class="flex flex-col items-center">
    <LogoTextWhite class="mb-6 sm:mb-14" />
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
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { AuthStrategy } from '~~/lib/auth/helpers/strategies'
import { useLoginOrRegisterUtils } from '~~/lib/auth/composables/auth'
import { loginServerInfoQuery } from '~~/lib/auth/graphql/queries'

const { result } = useQuery(loginServerInfoQuery)
const { appId, challenge } = useLoginOrRegisterUtils()

const serverInfo = computed(() => result.value?.serverInfo)
const hasLocalStrategy = computed(() =>
  (serverInfo.value?.authStrategies || []).some((s) => s.id === AuthStrategy.Local)
)
</script>
