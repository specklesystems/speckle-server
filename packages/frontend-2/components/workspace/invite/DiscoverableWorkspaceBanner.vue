<template>
  <InviteBanner :invite="invite" @processed="processJoin">
    <template #message>
      Your team is already using Workspaces! Collaborate in the
      <span class="font-medium">{{ workspace.name }}</span>
      space!
    </template>
  </InviteBanner>
</template>

<script setup lang="ts">
import { useApolloClient } from '@vue/apollo-composable'
import { useSynchronizedCookie } from '~/lib/common/composables/reactiveCookie'
import { graphql } from '~/lib/common/generated/gql'
import {
  DashboardJoinWorkspaceDocument,
  type WorkspaceInviteDiscoverableWorkspaceBanner_LimitedWorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import { CookieKeys } from '~/lib/common/helpers/constants'
import {
  getCacheId,
  getFirstErrorMessage,
  modifyObjectField
} from '~/lib/common/helpers/graphql'
import { workspaceRoute } from '~/lib/common/helpers/route'
import { useMixpanel } from '~~/lib/core/composables/mp'

graphql(`
  fragment WorkspaceInviteDiscoverableWorkspaceBanner_LimitedWorkspace on LimitedWorkspace {
    id
    name
    slug
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
  workspace: WorkspaceInviteDiscoverableWorkspaceBanner_LimitedWorkspaceFragment
}>()

const mixpanel = useMixpanel()
const { client: apollo } = useApolloClient()
const { activeUser } = useActiveUser()
const { triggerNotification } = useGlobalToast()
const router = useRouter()
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
    defaultLogoIndex: props.workspace.defaultLogoIndex
  }
}))

const processJoin = async (accept: boolean) => {
  if (!accept) {
    dismissedDiscoverableWorkspaces.value = [
      ...dismissedDiscoverableWorkspaces.value,
      props.workspace.id
    ]
    apollo.cache.evict({
      id: getCacheId('LimitedWorkspace', props.workspace.id)
    })
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
      id: getCacheId('LimitedWorkspace', props.workspace.id)
    })

    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Joined workspace',
      description: 'Successfully joined workspace'
    })

    mixpanel.track('Workspace Joined', {
      location: 'discovery banner',
      // eslint-disable-next-line camelcase
      workspace_id: props.workspace.id
    })

    router.push(workspaceRoute(props.workspace.slug))
  } else {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to join workspace',
      description: getFirstErrorMessage(result?.errors)
    })
  }
}
</script>
