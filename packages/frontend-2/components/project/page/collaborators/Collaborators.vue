<template>
  <div>
    <div v-if="project" class="pt-3">
      <div class="flex justify-between space-x-2 items-center">
        <h1 class="block text-heading-lg">Collaborators</h1>
        <div v-tippy="tooltipText">
          <FormButton :disabled="!canInvite" @click="toggleInviteDialog">
            Invite to project
          </FormButton>
        </div>
      </div>
      <div class="grid xl:grid-cols-3 gap-6 mt-6">
        <div v-if="project.workspace" class="xl:col-span-1">
          <p class="text-body-2xs text-foreground-2 font-medium mb-3">General access</p>
          <ProjectPageCollaboratorsGeneralAccess
            :name="project.workspace?.name"
            :logo="project.workspace?.logo"
            :can-edit="!!canUpdate?.authorized"
            :admins="workspaceAdmins"
            :workspace-id="project.workspaceId"
          />
        </div>
        <div
          class="flex flex-col flex-grow gap-y-3"
          :class="project.workspace ? 'xl:col-span-2' : 'col-span-3'"
        >
          <p class="text-body-2xs text-foreground-2 font-medium">Project members</p>
          <div>
            <ProjectPageCollaboratorsRow
              v-for="collaborator in collaboratorListItems"
              :key="collaborator.id"
              :can-edit="!!canUpdate?.authorized"
              :collaborator="collaborator"
              :workspace="project.workspace"
              :loading="loading"
              @cancel-invite="onCancelInvite"
              @change-role="onCollaboratorRoleChange"
            />
          </div>
        </div>
      </div>
      <InviteDialogProject
        v-if="project"
        v-model:open="showInviteDialog"
        :project="project"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Project } from '~~/lib/common/generated/gql/graphql'
import type { ProjectCollaboratorListItem } from '~~/lib/projects/helpers/components'
import { type Nullable, type StreamRoles, Roles } from '@speckle/shared'
import { useQuery, useApolloClient } from '@vue/apollo-composable'
import { useTeamInternals } from '~~/lib/projects/composables/team'
import { graphql } from '~~/lib/common/generated/gql'
import { useMixpanel } from '~~/lib/core/composables/mp'
import {
  getCacheId,
  getObjectReference,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import {
  useCancelProjectInvite,
  useUpdateUserRole
} from '~~/lib/projects/composables/projectManagement'

graphql(`
  fragment ProjectPageCollaborators_Project on Project {
    id
    permissions {
      canUpdate {
        ...FullPermissionCheckResult
      }
    }
  }
`)

const projectPageCollaboratorsQuery = graphql(`
  query ProjectPageCollaborators($projectId: String!, $filter: WorkspaceTeamFilter!) {
    project(id: $projectId) {
      id
      ...ProjectPageTeamInternals_Project
      ...InviteDialogProject_Project
      ...ProjectPageCollaborators_Project
      workspaceId
      workspace {
        ...SettingsWorkspacesMembersTableHeader_Workspace
        name
        logo
        team(filter: $filter) {
          items {
            ...ProjectPageCollaborators_WorkspaceCollaborator
          }
        }
      }
    }
  }
`)

const projectId = computed(() => route.params.id as string)

const route = useRoute()
const apollo = useApolloClient().client
const mixpanel = useMixpanel()
const cancelInvite = useCancelProjectInvite()
const { result: pageResult } = useQuery(projectPageCollaboratorsQuery, () => ({
  projectId: projectId.value,
  filter: {
    roles: [Roles.Workspace.Admin]
  }
}))

const showInviteDialog = ref(false)
const loading = ref(false)

const canUpdate = computed(() => pageResult.value?.project?.permissions?.canUpdate)
const canInvite = computed(() =>
  project.value?.workspaceId
    ? isOwner.value || workspace.value?.role === Roles.Workspace.Admin
    : isOwner.value
)
const tooltipText = computed(() =>
  canInvite.value
    ? undefined
    : project.value?.workspaceId
    ? 'Only project owners and workspace admins can manage the project members'
    : 'Only project owners can manage the project members'
)
const project = computed(() => pageResult.value?.project)
const workspace = computed(() => project.value?.workspace)
const workspaceAdmins = computed(
  () => pageResult.value?.project?.workspace?.team?.items || []
)
const updateRole = useUpdateUserRole(project)
const { collaboratorListItems, isOwner } = useTeamInternals(project)

const toggleInviteDialog = () => {
  showInviteDialog.value = true
}

const onCollaboratorRoleChange = async (
  collaborator: ProjectCollaboratorListItem,
  newRole: Nullable<StreamRoles>
) => {
  if (collaborator.inviteId) return

  loading.value = true
  await updateRole({
    projectId: projectId.value,
    userId: collaborator.id,
    role: newRole
  })
  loading.value = false

  mixpanel.track('Stream Action', {
    type: 'action',
    name: 'update',
    action: 'team member role',
    // eslint-disable-next-line camelcase
    workspace_id: workspace.value?.id
  })

  if (!newRole) {
    // Remove from team
    modifyObjectFields<undefined, Project['team']>(
      apollo.cache,
      getCacheId('Project', projectId.value),
      (fieldName, _variables, value) => {
        if (fieldName !== 'team') return
        return value.filter(
          (t) =>
            // @ts-expect-error: for some reason the type is just a Reference, doesn't know about the user
            !t.user ||
            // @ts-expect-error: for some reason the type is just a Reference, doesn't know about the user
            t.user.__ref !== getObjectReference('LimitedUser', collaborator.id).__ref
        )
      }
    )
  }
}

const onCancelInvite = (inviteId: string) => {
  cancelInvite({
    projectId: projectId.value,
    inviteId
  })
}
</script>
