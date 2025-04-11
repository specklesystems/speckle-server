<template>
  <div>
    <div class="flex flex-col space-y-4">
      <div v-if="hasWorkspaces">
        <p class="mb-4">Select an existing workspaces or create a new one.</p>
        <div class="flex flex-col gap-2">
          <button
            v-for="ws in workspaces"
            :key="ws.id"
            class="w-full"
            @click="handleWorkspaceClick(ws)"
          >
            <WorkspaceCard
              :logo="ws.logo ?? ''"
              :name="ws.name"
              :clickable="ws.role === Roles.Workspace.Admin"
            >
              <template #text>
                <div class="flex flex-col gap-2 items-start">
                  <p>
                    {{ ws.projects.totalCount }} projects,
                    {{ ws.projects.totalCount }} models
                  </p>
                  <UserAvatarGroup
                    :users="ws.team.items.map((t) => t.user)"
                    :max-count="6"
                  />
                </div>
              </template>
              <template #actions>
                <CommonBadge color="secondary" class="capitalize" rounded>
                  {{ ws.plan?.name }}
                </CommonBadge>
              </template>
            </WorkspaceCard>
          </button>
        </div>
      </div>
      <p v-else class="text-body-xs text-foreground">
        Looks like you haven't created any workspaces yet. Workspaces help you easily
        organise and control your digital projects. Create one to move your project
        into.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type {
  WorkspaceMoveProjectSelectProject_ProjectFragment,
  WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment
} from '~~/lib/common/generated/gql/graphql'
import { useQuery } from '@vue/apollo-composable'
import { UserAvatarGroup } from '@speckle/ui-components'
import { Roles } from '@speckle/shared'
import { workspaceMoveProjectManagerUserQuery } from '~/lib/workspaces/graphql/queries'

graphql(`
  fragment WorkspaceMoveProjectSelectWorkspace_User on User {
    workspaces {
      items {
        ...WorkspaceMoveProjectSelectWorkspace_Workspace
      }
    }
    projects(cursor: $cursor, filter: $filter) {
      items {
        ...WorkspaceMoveProjectSelectProject_Project
      }
      cursor
      totalCount
    }
  }
`)

graphql(`
  fragment WorkspaceMoveProjectSelectWorkspace_Workspace on Workspace {
    id
    role
    name
    logo
    slug
    plan {
      name
    }
    projects {
      totalCount
    }
    team {
      items {
        user {
          id
          name
          avatar
        }
      }
    }
    ...WorkspaceHasCustomDataResidency_Workspace
  }
`)

defineProps<{
  project?: WorkspaceMoveProjectSelectProject_ProjectFragment
  eventSource?: string
}>()

const emit = defineEmits<{
  (
    e: 'workspace-selected',
    workspace: WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment
  ): void
}>()

const { result } = useQuery(workspaceMoveProjectManagerUserQuery)

const workspaces = computed(() => result.value?.activeUser?.workspaces.items ?? [])
const hasWorkspaces = computed(() => workspaces.value.length > 0)

const handleWorkspaceClick = (
  ws: WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment
) => {
  emit('workspace-selected', ws)
}
</script>
