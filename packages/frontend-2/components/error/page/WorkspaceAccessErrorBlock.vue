<template>
  <NuxtErrorBoundary @error="onError">
    <WorkspaceInviteBanner
      v-if="invite"
      :invite="invite"
      :show-workspace-name="false"
      block
      @processed="onProcessed"
    />
    <ErrorPageGenericUnauthorizedBlock v-else resource-type="workspace" />
  </NuxtErrorBoundary>
</template>
<script setup lang="ts">
import { waitForever, type Optional } from '@speckle/shared'
import { useQuery } from '@vue/apollo-composable'
import { useNavigateToHome, workspaceRoute } from '~/lib/common/helpers/route'
import { workspaceInviteQuery } from '~/lib/workspaces/graphql/queries'

const route = useRoute()
const logger = useLogger()
const goHome = useNavigateToHome()

const token = computed(() => route.query.token as Optional<string>)
const workspaceId = computed(() => route.params.id as Optional<string>)

const { result } = useQuery(
  workspaceInviteQuery,
  () => ({
    workspaceId: workspaceId.value || '',
    token: token.value
  }),
  () => ({ enabled: !!workspaceId.value })
)

const invite = computed(() => result.value?.workspaceInvite)

const onError = (err: unknown) => logger.error(err)

const onProcessed = async (accepted: boolean) => {
  if (!import.meta.client) return

  if (accepted) {
    if (workspaceId.value) {
      window.location.href = workspaceRoute(workspaceId.value)
    } else {
      window.location.reload()
    }
    await waitForever() // to prevent UI changes while reload is happening
  } else {
    await goHome()
  }
}
</script>
