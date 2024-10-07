<template>
  <NuxtErrorBoundary @error="onError">
    <WorkspaceInviteBlock v-if="invite" :invite="invite" />
    <ErrorPageGenericUnauthorizedBlock v-else resource-type="workspace" />
  </NuxtErrorBoundary>
</template>
<script setup lang="ts">
import { type Optional } from '@speckle/shared'
import { useQuery } from '@vue/apollo-composable'
import { workspaceInviteQuery } from '~/lib/workspaces/graphql/queries'

const route = useRoute()
const logger = useLogger()

const token = computed(() => route.query.token as Optional<string>)
const workspaceSlug = computed(() => route.params.slug as Optional<string>)
const isWorkspacesEnabled = useIsWorkspacesEnabled()

const { result } = useQuery(
  workspaceInviteQuery,
  () => ({
    workspaceId: workspaceSlug.value,
    token: token.value,
    options: {
      useSlug: true
    }
  }),
  () => ({ enabled: !!(workspaceSlug.value && isWorkspacesEnabled.value) })
)

const invite = computed(() => result.value?.workspaceInvite)

const onError = (err: unknown) => logger.error(err)
</script>
