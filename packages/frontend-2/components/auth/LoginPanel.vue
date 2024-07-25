<template>
  <Component
    :is="concreteComponent"
    v-if="!isLoggedIn"
    no-shadow
    class="mx-auto w-full"
  >
    <div class="space-y-4">
      <div class="flex flex-col items-center gap-y-2">
        <h1 class="text-heading-xl text-center inline-block">
          {{ title }}
        </h1>
        <h2 class="text-body-sm text-center text-foreground-2">
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
        <div
          v-if="hasLocalStrategy"
          class="text-center text-foreground-2 mb-2 text-body-2xs font-normal"
        >
          {{
            hasThirdPartyStrategies
              ? 'Or login with your email'
              : 'Login with your email'
          }}
        </div>
        <AuthLoginWithEmailBlock v-if="hasLocalStrategy" :challenge="challenge" />
        <div class="text-center text-body-sm">
          <span class="mr-2">Don't have an account?</span>
          <CommonTextLink :to="finalRegisterRoute" :icon-right="ArrowRightIcon">
            Register
          </CommonTextLink>
        </div>
      </div>
    </div>
  </Component>
  <div v-else />
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { AuthStrategy } from '~~/lib/auth/helpers/strategies'
import { useLoginOrRegisterUtils, useAuthManager } from '~~/lib/auth/composables/auth'
import { loginServerInfoQuery } from '~~/lib/auth/graphql/queries'
import { LayoutDialog } from '@speckle/ui-components'
import { ArrowRightIcon } from '@heroicons/vue/20/solid'
import { registerRoute } from '~~/lib/common/helpers/route'

const props = withDefaults(
  defineProps<{
    dialogMode?: boolean
    title?: string
    subtitle?: string
  }>(),
  {
    dialogMode: false,
    title: 'Speckle login',
    subtitle: 'Connectivity, Collaboration and Automation for 3D'
  }
)

const { isLoggedIn } = useActiveUser()
const { inviteToken } = useAuthManager()
const router = useRouter()

const finalRegisterRoute = computed(() => {
  const result = router.resolve({
    path: registerRoute,
    query: inviteToken.value ? { token: inviteToken.value } : {}
  })
  return result.fullPath
})

const concreteComponent = computed(() => {
  return props.dialogMode ? LayoutDialog : 'div'
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
