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
const workspaceId = computed(() => route.params.id as Optional<string>)

const { result } = useQuery(
  workspaceInviteQuery,
  () => ({
    workspaceId: workspaceId.value,
    token: token.value
  }),
  () => ({ enabled: !!workspaceId.value })
)

const invite = computed(() => result.value?.workspaceInvite)

const onError = (err: unknown) => logger.error(err)
</script>
