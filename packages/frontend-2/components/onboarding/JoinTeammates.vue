<!-- FF-CLEANUP: Remove when workspaces plans released -->
<template>
  <div class="flex flex-col items-center gap-2 w-full">
    <CommonCard
      v-for="workspace in workspaces"
      :key="workspace.id"
      class="w-full bg-foundation"
    >
      <div class="flex gap-4">
        <div>
          <WorkspaceAvatar :name="workspace.name" :logo="workspace.logo" size="xl" />
        </div>
        <div class="flex flex-col sm:flex-row gap-4 justify-between flex-1">
          <div class="flex flex-col flex-1">
            <h6 class="text-heading-sm">{{ workspace.name }}</h6>
            <p class="text-body-2xs text-foreground-2">{{ workspace.description }}</p>
          </div>
          <FormButton
            color="outline"
            size="sm"
            :loading="loadingStates[workspace.id]"
            :disabled="requestedWorkspaces.includes(workspace.id)"
            @click="() => processRequest(true, workspace.id)"
          >
            {{
              requestedWorkspaces.includes(workspace.id)
                ? 'Requested'
                : 'Request to join'
            }}
          </FormButton>
        </div>
      </div>
    </CommonCard>
    <div class="mt-2 w-full">
      <FormButton size="lg" full-width @click="$emit('next')">Continue</FormButton>
    </div>
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

const loadingStates = ref<Record<string, boolean>>({})

const { mutate: requestToJoin } = useMutation(dashboardRequestToJoinWorkspaceMutation)

const requestedWorkspaces = ref<string[]>([])

const processRequest = async (accept: boolean, workspaceId: string) => {
  if (accept) {
    loadingStates.value[workspaceId] = true

    try {
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
    } finally {
      loadingStates.value[workspaceId] = false
    }
  }
}
</script>
