<template>
  <InviteBanner :invite="invite" @processed="processRequest">
    <template #message>
      Your team is already using Workspaces, request to join the
      <span class="font-medium">{{ workspace.name }}</span>
      space!
    </template>
  </InviteBanner>
</template>

<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import { useSynchronizedCookie } from '~/lib/common/composables/reactiveCookie'
import { graphql } from '~/lib/common/generated/gql'
import { type WorkspaceInviteDiscoverableWorkspaceBanner_LimitedWorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { CookieKeys } from '~/lib/common/helpers/constants'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { dashboardRequestToJoinWorkspaceMutation } from '~~/lib/dashboard/graphql/mutations'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'

graphql(`
  fragment WorkspaceInviteDiscoverableWorkspaceBanner_LimitedWorkspace on LimitedWorkspace {
    id
    name
    slug
    description
    logo
  }
`)

const props = defineProps<{
  workspace: WorkspaceInviteDiscoverableWorkspaceBanner_LimitedWorkspaceFragment
}>()

const { mutate: requestToJoin } = useMutation(dashboardRequestToJoinWorkspaceMutation)
const mixpanel = useMixpanel()
const { triggerNotification } = useGlobalToast()
const dismissedDiscoverableWorkspaces = useSynchronizedCookie<string[]>(
  CookieKeys.DismissedDiscoverableWorkspaces,
  {
    default: () => []
  }
)

const invite = computed(() => ({
  workspace: {
    id: props.workspace.id,
    logo: props.workspace.logo || undefined,
    name: props.workspace.name
  }
}))

const processRequest = async (accept: boolean) => {
  if (accept) {
    const result = await requestToJoin({
      input: { workspaceId: props.workspace.id }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      // Dismiss it show it doesnt show again
      dismissedDiscoverableWorkspaces.value = [
        ...dismissedDiscoverableWorkspaces.value,
        props.workspace.id
      ]

      mixpanel.track('Workspace Join Request Sent', {
        workspaceId: props.workspace.id,
        location: 'discovery banner',
        // eslint-disable-next-line camelcase
        workspace_id: props.workspace.id
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
  } else {
    dismissedDiscoverableWorkspaces.value = [
      ...dismissedDiscoverableWorkspaces.value,
      props.workspace.id
    ]

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
