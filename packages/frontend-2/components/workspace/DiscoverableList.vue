<template>
  <div class="flex flex-col items-center gap-2 w-full max-w-lg mx-auto">
    <h1 v-if="showHeader" class="text-heading-xl text-forefround mb-2 font-normal mt-4">
      {{ title }}
    </h1>
    <p v-if="showHeader" class="text-center text-body-sm text-foreground-2 mb-8">
      {{ displayDescription }}
    </p>
    <CommonCard
      v-for="workspace in discoverableWorkspaces"
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
      <FormButton
        size="lg"
        full-width
        color="outline"
        @click="navigateTo(workspaceCreateRoute())"
      >
        Create a new workspace
      </FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { dashboardRequestToJoinWorkspaceMutation } from '~~/lib/dashboard/graphql/mutations'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useMutation } from '@vue/apollo-composable'
import { workspaceCreateRoute } from '~~/lib/common/helpers/route'
import { useDiscoverableWorkspaces } from '~/lib/workspaces/composables/discoverableWorkspaces'

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    showHeader?: boolean
  }>(),
  {
    title: 'Join teammates',
    showHeader: true
  }
)

const { discoverableWorkspaces } = useDiscoverableWorkspaces()

const defaultDescription = computed(() => {
  const count = discoverableWorkspaces.value.length
  if (count === 0) return 'No workspaces found matching your email domain'
  if (count === 1) return 'We found a workspace that matches your email domain'
  return `We found ${count} workspaces that match your email domain`
})

const displayDescription = computed(() => props.description ?? defaultDescription.value)

const emit = defineEmits<{
  (e: 'workspace-joined'): void
}>()

const mixpanel = useMixpanel()
const { triggerNotification } = useGlobalToast()
const { mutate: requestToJoin } = useMutation(dashboardRequestToJoinWorkspaceMutation)

const loadingStates = ref<Record<string, boolean>>({})
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

        emit('workspace-joined')
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
