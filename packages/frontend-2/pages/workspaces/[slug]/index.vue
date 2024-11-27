<template>
  <div>
    <div v-if="ssoError">
      {{ ssoError }}
      <a :href="`/workspaces/${workspaceSlug}/sso?redirect=${$route.fullPath}`">
        Sign in with SSO
      </a>
    </div>
    <WorkspaceInviteWrapper
      v-if="token"
      :workspace-slug="workspaceSlug"
      :token="token"
    />
    <WorkspaceProjectList v-else :workspace-slug="workspaceSlug" />
  </div>
</template>

<script setup lang="ts">
import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import { WorkspaceProjectsUpdatedMessageType } from '~/lib/common/generated/gql/graphql'
import { projectRoute } from '~/lib/common/helpers/route'
import { useOnWorkspaceUpdated } from '~/lib/workspaces/composables/management'
import { useWorkspaceSsoValidation } from '~/lib/workspaces/composables/sso'

definePageMeta({
  middleware: ['requires-workspaces-enabled', 'require-valid-workspace']
})

const route = useRoute()
const apollo = useApolloClient().client
const { triggerNotification } = useGlobalToast()

const workspaceSlug = computed(() => route.params.slug as string)
const { ssoError } = useWorkspaceSsoValidation(workspaceSlug)
useOnWorkspaceUpdated({ workspaceSlug })
const { onResult: onWorkspaceProjectsUpdate } = useSubscription(
  graphql(`
    subscription OnWorkspaceProjectsUpdate($slug: String!) {
      workspaceProjectsUpdated(workspaceId: null, workspaceSlug: $slug) {
        projectId
        workspaceId
        type
        project {
          ...ProjectDashboardItem
        }
      }
    }
  `),
  () => ({ slug: workspaceSlug.value })
)

const token = computed(() => route.query.token as string | undefined)

onWorkspaceProjectsUpdate((res) => {
  const event = res.data?.workspaceProjectsUpdated
  if (!event) return

  const cache = apollo.cache
  const isNewProject = event.type === WorkspaceProjectsUpdatedMessageType.Added
  const incomingProject = event.project
  const workspaceId = event.workspaceId
  const projectId = event.projectId

  if (isNewProject && incomingProject) {
    // Add to workspace.projects
    modifyObjectField(
      cache,
      getCacheId('Workspace', workspaceId),
      'projects',
      ({ helpers: { ref, createUpdatedValue } }) =>
        createUpdatedValue(({ update }) => {
          update('items', (items) => [
            ref('Project', incomingProject.id),
            ...(items || [])
          ])
          update('totalCount', (count) => count + 1)
        }),
      { autoEvictFiltered: true }
    )
  } else if (!isNewProject) {
    // Being removed, remove from workspace.projects specifically
    // (the project may still exist, but in a different workspace)
    modifyObjectField(
      cache,
      getCacheId('Workspace', workspaceId),
      'projects',
      ({ helpers: { createUpdatedValue, readField } }) =>
        createUpdatedValue(({ update }) => {
          update('items', (items) =>
            items.filter((item) => readField(item, 'id') !== projectId)
          )
          update('totalCount', (count) => count - 1)
        }),
      { autoEvictFiltered: true }
    )
  }

  // Emit toast notification
  triggerNotification({
    type: ToastNotificationType.Info,
    title: isNewProject ? 'New project added' : 'A project has been removed',
    cta:
      isNewProject && incomingProject
        ? {
            url: projectRoute(incomingProject.id),
            title: 'View project'
          }
        : undefined
  })
})
</script>
