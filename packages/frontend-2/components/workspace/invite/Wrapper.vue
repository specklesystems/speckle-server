<template>
  <div class="flex justify-center">
    <WorkspaceInviteBlock v-if="invite" :invite="invite" />
    <CommonLoadingIcon v-else />
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { workspaceInviteQuery } from '~/lib/workspaces/graphql/queries'

const props = defineProps<{
  workspaceSlug: string
  token: string
}>()

const { result } = useQuery(workspaceInviteQuery, {
  workspaceId: props.workspaceSlug,
  token: props.token,
  options: { useSlug: true }
})

const invite = computed(() => result.value?.workspaceInvite)
</script>
