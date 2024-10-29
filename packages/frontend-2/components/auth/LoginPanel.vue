<template>
  <Component
    :is="concreteComponent"
    v-if="!isLoggedIn"
    no-shadow
    class="mx-auto w-full"
  >
    <div class="flex flex-col gap-4">
      <div v-if="!workspaceInvite" class="flex flex-col items-center gap-y-2 pb-4">
        <h1 class="text-heading-xl text-center inline-block">
          {{ title }}
        </h1>
        <h2 class="text-body-sm text-center text-foreground-2">
          {{ subtitle }}
        </h2>
      </div>
      <AuthWorkspaceInviteHeader v-else :invite="workspaceInvite" />
      <AuthThirdPartyLoginBlock
        v-if="hasThirdPartyStrategies && serverInfo"
        :server-info="serverInfo"
        :challenge="challenge"
        :app-id="appId"
        :newsletter-consent="false"
      />
      <FormButton color="outline" full-width size="lg" to="/authn/sso">
        Continue with SSO
      </FormButton>
      <div class="h-px w-full bg-outline-3 mt-2 shrink-0" />
      <div>
        <AuthLoginWithEmailBlock
          v-if="hasLocalStrategy"
          :challenge="challenge"
          :workspace-invite="workspaceInvite || undefined"
        />
        <div v-if="!forcedInviteEmail" class="text-center text-body-sm">
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
import { LayoutDialog } from '@speckle/ui-components'
import { ArrowRightIcon } from '@heroicons/vue/20/solid'
import { registerRoute } from '~~/lib/common/helpers/route'
import {
  authLoginPanelQuery,
  authLoginPanelWorkspaceInviteQuery
} from '~/lib/auth/graphql/queries'

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

const { appId, challenge } = useLoginOrRegisterUtils()
const { isLoggedIn } = useActiveUser()
const { inviteToken } = useAuthManager()
const router = useRouter()
const isWorkspacesEnabled = useIsWorkspacesEnabled()

const { result } = useQuery(authLoginPanelQuery)

const { result: workspaceInviteResult } = useQuery(
  authLoginPanelWorkspaceInviteQuery,
  () => ({
    token: inviteToken.value
  }),
  () => ({
    enabled: isWorkspacesEnabled.value
  })
)

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

const workspaceInvite = computed(() => workspaceInviteResult.value?.workspaceInvite)
const forcedInviteEmail = computed(() => workspaceInvite.value?.email)

const serverInfo = computed(() => result.value?.serverInfo)
const hasLocalStrategy = computed(() =>
  (serverInfo.value?.authStrategies || []).some((s) => s.id === AuthStrategy.Local)
)

const hasThirdPartyStrategies = computed(() =>
  serverInfo.value?.authStrategies.some((s) => s.id !== AuthStrategy.Local)
)
</script>
