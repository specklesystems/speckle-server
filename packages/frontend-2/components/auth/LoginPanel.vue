<template>
  <Component
    :is="concreteComponent"
    fancy-glow
    no-shadow
    class="max-w-lg mx-auto w-full"
  >
    <div class="space-y-4">
      <div class="flex flex-col items-center space-y-2">
        <h1
          class="text-center h3 font-bold bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 inline-block py-1 text-transparent bg-clip-text"
        >
          {{ title }}
        </h1>
        <h2 class="text-center text-foreground-2">
          {{ subtitle }}
        </h2>
      </div>
      <AuthThirdPartyLoginBlock
        v-if="hasThirdPartyStrategies && serverInfo"
        :server-info="serverInfo"
        :challenge="challenge"
        :app-id="appId"
      />
      <div>
        <div class="text-center label text-foreground-2 mb-3 text-xs font-normal">
          {{
            hasThirdPartyStrategies
              ? 'Or login with your email'
              : 'Login with your email'
          }}
        </div>
        <AuthLoginWithEmailBlock v-if="hasLocalStrategy" :challenge="challenge" />
      </div>
    </div>
  </Component>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { AuthStrategy } from '~~/lib/auth/helpers/strategies'
import { useLoginOrRegisterUtils } from '~~/lib/auth/composables/auth'
import { loginServerInfoQuery } from '~~/lib/auth/graphql/queries'
import { LayoutDialog, LayoutPanel } from '@speckle/ui-components'

const props = withDefaults(
  defineProps<{
    dialogMode?: boolean
    title?: string
    subtitle?: string
  }>(),
  {
    dialogMode: false,
    title: 'Speckle Login',
    subtitle: 'Interoperability, Collaboration and Automation for 3D'
  }
)

const concreteComponent = computed(() => {
  return props.dialogMode ? LayoutDialog : LayoutPanel
})

const { result } = useQuery(loginServerInfoQuery)
const { appId, challenge } = useLoginOrRegisterUtils()

const serverInfo = computed(() => result.value?.serverInfo)
const hasLocalStrategy = computed(() =>
  (serverInfo.value?.authStrategies || []).some((s) => s.id === AuthStrategy.Local)
)

const hasThirdPartyStrategies = computed(() =>
  serverInfo.value?.authStrategies.some((s) => s.id !== AuthStrategy.Local)
)
</script>
