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

const { processRequest } = useDiscoverableWorkspaces()
const mixpanel = useMixpanel()
const { triggerNotification } = useGlobalToast()

const invite = computed(() => ({
  workspace: {
    id: props.workspace.id,
    logo: props.workspace.logo || undefined,
    name: props.workspace.name
  }
}))

const emit = defineEmits<{
  (e: 'dismiss', workspaceId: string): void
}>()

const handleRequest = async (accept: boolean) => {
  if (accept) {
    await processRequest(true, props.workspace.id)
    emit('dismiss', props.workspace.id)
  } else {
    emit('dismiss', props.workspace.id)
    mixpanel.track('Workspace Discovery Banner Dismissed', {
      workspaceId: props.workspace.id,
      location: 'discovery banner',
      // eslint-disable-next-line camelcase
      workspace_id: props.workspace.id
    })
    triggerNotification({
      title: 'Discoverable workspace dismissed',
      type: ToastNotificationType.Info
    })
  }
}
</script>
