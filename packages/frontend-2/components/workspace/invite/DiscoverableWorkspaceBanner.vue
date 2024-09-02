<template>
  <InviteBanner :invite="invite" @processed="processJoin">
    <template #message>
      Your team is already using Workspaces! Collaborate with your peers in the
      <span class="font-medium">{{ workspace.name }}</span>
      space!
    </template>
  </InviteBanner>
</template>

<script setup lang="ts">
import { useApolloClient } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import {
  DashboardJoinWorkspaceDocument,
  type WorkspaceInviteDiscoverableWorkspaceBanner_DiscoverableWorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import { getCacheId, getFirstErrorMessage } from '~/lib/common/helpers/graphql'

graphql(`
  fragment WorkspaceInviteDiscoverableWorkspaceBanner_DiscoverableWorkspace on DiscoverableWorkspace {
    id
    name
    description
    logo
    defaultLogoIndex
  }
  fragment WorkspaceInviteDiscoverableWorkspaceBanner_Workspace on Workspace {
    id
    name
    description
    createdAt
    updatedAt
    logo
    defaultLogoIndex
    domainBasedMembershipProtectionEnabled
    discoverabilityEnabled
  }
`)

const props = defineProps<{
  workspace: WorkspaceInviteDiscoverableWorkspaceBanner_DiscoverableWorkspaceFragment
}>()

const { client: apollo } = useApolloClient()
const { triggerNotification } = useGlobalToast()
const router = useRouter()

const invite = computed(() => ({
  workspace: {
    id: props.workspace.id,
    logo: props.workspace.logo || undefined,
    defaultLogoIndex: props.workspace.defaultLogoIndex
  }
}))

const processJoin = async (accept: boolean) => {
  if (!accept) {
    // TODO: Use cookies to enable dismissing the discoverable workspace invite
    return
  }

  const result = await apollo
    .mutate({
      mutation: DashboardJoinWorkspaceDocument,
      variables: {
        input: {
          workspaceId: props.workspace.id
        }
      }
    })
    .catch(convertThrowIntoFetchResult)

  if (result?.data) {
    apollo.cache.evict({
      id: getCacheId('DiscoverableWorkspace', props.workspace.id)
    })
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Joined workspace',
      description: 'Successfully joined workspace'
    })
    router.push(`/workspaces/${props.workspace.id}`)
  } else {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to join workspace',
      description: getFirstErrorMessage(result?.errors)
    })
  }
}
</script>
