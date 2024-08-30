<template>
  <InviteBanner :invite="invite" @processed="processJoin">
    <template #message>
      You may join the workspace
      <span class="font-medium">{{ workspace.name }}</span>
      because it is part of your organization
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
import {
  getCacheId,
  getFirstErrorMessage,
  modifyObjectField
} from '~/lib/common/helpers/graphql'

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
const { activeUser } = useActiveUser()
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

  const userId = activeUser.value?.id
  if (!userId) return

  const result = await apollo
    .mutate({
      mutation: DashboardJoinWorkspaceDocument,
      variables: {
        input: {
          workspaceId: props.workspace.id
        }
      },
      update(cache, { data }) {
        const workspaceId = data?.workspaceMutations.join.id
        if (!workspaceId) return

        modifyObjectField(
          cache,
          getCacheId('User', userId),
          'workspaces',
          ({ variables, helpers: { evict, createUpdatedValue, ref } }) => {
            if (variables.filter?.search?.length) return evict()

            return createUpdatedValue(({ update }) => {
              update('totalCount', (totalCount) => totalCount + 1)
              update('items', (items) => [...items, ref('Workspace', workspaceId)])
            })
          }
        )
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
