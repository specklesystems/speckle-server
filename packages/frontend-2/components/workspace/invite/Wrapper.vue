<template>
  <div class="flex justify-center">
    <WorkspaceInviteBlock v-if="invite" :invite="invite" />
    <CommonLoadingIcon v-else-if="loading" />
    <div v-else>No invite found</div>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { workspaceInviteQuery } from '~/lib/workspaces/graphql/queries'

const props = defineProps<{
  workspaceSlug: string
  token: string
}>()

const { result, loading } = useQuery(workspaceInviteQuery, {
  workspaceId: props.workspaceSlug,
  token: props.token,
  options: { useSlug: true }
})

const invite = computed(() => result.value?.workspaceInvite)
</script>
