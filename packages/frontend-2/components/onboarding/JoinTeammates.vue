<template>
  <div class="flex flex-col items-center gap-4 w-full">
    <CommonCard
      v-for="workspace in workspaces"
      :key="workspace.id"
      class="w-full bg-foundation"
    >
      <div class="flex gap-4">
        <div>
          <WorkspaceAvatar
            v-if="workspace"
            :name="workspace.name"
            :logo="workspace.logo"
            size="xl"
          />
        </div>
        <div class="flex flex-col flex-1">
          <h6 class="text-heading-sm">{{ workspace.name }}</h6>
          <p class="text-body-2xs text-foreground-2">{{ workspace.description }}</p>
        </div>
        <FormButton
          color="outline"
          size="sm"
          :loading="loading"
          :disabled="requestedWorkspaces.includes(workspace.id)"
          @click="() => processRequest(true, workspace.id)"
        >
          {{
            requestedWorkspaces.includes(workspace.id) ? 'Requested' : 'Request to join'
          }}
        </FormButton>
      </div>
    </CommonCard>
    <FormButton @click="$emit('next')">Continue</FormButton>
  </div>
</template>

<script setup lang="ts">
import type { LimitedWorkspace } from '~/lib/common/generated/gql/graphql'
import { dashboardRequestToJoinWorkspaceMutation } from '~~/lib/dashboard/graphql/mutations'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useMutation } from '@vue/apollo-composable'

defineProps<{
  workspaces: LimitedWorkspace[]
}>()

defineEmits(['next'])

const mixpanel = useMixpanel()
const { triggerNotification } = useGlobalToast()

const { mutate: requestToJoin, loading } = useMutation(
  dashboardRequestToJoinWorkspaceMutation
)

const requestedWorkspaces = ref<string[]>([])

const processRequest = async (accept: boolean, workspaceId: string) => {
  if (accept) {
    const result = await requestToJoin({
      input: { workspaceId }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      requestedWorkspaces.value.push(workspaceId)
      mixpanel.track('Workspace Join Request Sent', {
        workspaceId,
        location: 'onboarding',
        // eslint-disable-next-line camelcase
        workspace_id: workspaceId
      })

      triggerNotification({
        title: 'Request sent',
        description: 'Your request to join the workspace has been sent.',
        type: ToastNotificationType.Success
      })
    } else {
      const errorMessage = getFirstErrorMessage(result?.errors)
      triggerNotification({
        title: 'Failed to send request',
        description: errorMessage,
        type: ToastNotificationType.Danger
      })
    }
  }
}
</script>
