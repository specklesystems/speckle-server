<template>
  <InviteBanner :invite="invite" @processed="handleRequest">
    <template #message>
      Your team is already using Workspaces, request to join the
      <span class="font-medium">{{ workspace.name }}</span>
      space!
    </template>
  </InviteBanner>
</template>

<script setup lang="ts">
import { useDiscoverableWorkspaces } from '~/lib/workspaces/composables/discoverableWorkspaces'
import { useMixpanel } from '~~/lib/core/composables/mp'
import type { LimitedWorkspace } from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  workspace: LimitedWorkspace
}>()

const { requestToJoinWorkspace, dismissDiscoverableWorkspace } =
  useDiscoverableWorkspaces()
const mixpanel = useMixpanel()

const invite = computed(() => ({
  workspace: {
    id: props.workspace.id,
    logo: props.workspace.logo || undefined,
    name: props.workspace.name
  }
}))

const handleRequest = async (accept: boolean) => {
  if (accept) {
    await requestToJoinWorkspace(props.workspace, 'discovery banner')
  } else {
    await dismissDiscoverableWorkspace(props.workspace.id)
    mixpanel.track('Workspace Discovery Banner Dismissed', {
      workspaceId: props.workspace.id,
      location: 'discovery_banner',
      // eslint-disable-next-line camelcase
      workspace_id: props.workspace.id
    })
  }
}
</script>
