<template>
  <div>
    <div v-if="project" class="pt-3">
      <div class="flex justify-between space-x-2 items-center">
        <h1 class="block text-heading-lg md:text-heading-xl">Project collaborators</h1>
        <FormButton :disabled="!canInvite" @click="toggleInviteDialog">
          Invite to project
        </FormButton>
      </div>
      <div class="flex flex-col mt-6 gap-y-6">
        <div
          v-if="isWorkspaceNewPlansEnabled && workspace"
          class="flex flex-col gap-y-3"
        >
          <p class="text-body-2xs text-foreground-2 font-medium">General access</p>
          <ProjectPageCollaboratorsGeneralAccessRow
            :name="workspace.name"
            :logo="workspace?.logo"
            :can-edit="canEdit"
          />
        </div>
        <div class="flex flex-col gap-y-3">
          <p class="text-body-2xs text-foreground-2 font-medium">Project members</p>
          <div>
            <ProjectPageCollaboratorsRow
              v-for="collaborator in collaboratorListItems"
              :key="collaborator.id"
              :can-edit="canEdit"
              :collaborator="collaborator"
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

const projectPageCollaboratorsQuery = graphql(`
  query ProjectPageCollaborators($projectId: String!) {
    project(id: $projectId) {
      id
      ...ProjectPageTeamInternals_Project
      ...InviteDialogProject_Project
      workspaceId
    }
  }
`)

const projectPageCollaboratorWorkspaceQuery = graphql(`
  query ProjectPageSettingsCollaboratorsWorkspace($workspaceId: String!) {
    workspace(id: $workspaceId) {
      ...ProjectPageTeamInternals_Workspace
      name
      logo
    }
  }
`)

const projectId = computed(() => route.params.id as string)

const route = useRoute()
const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()
const isWorkspacesEnabled = useIsWorkspacesEnabled()
const apollo = useApolloClient().client
const mixpanel = useMixpanel()
const cancelInvite = useCancelProjectInvite()
const { result: pageResult } = useQuery(projectPageCollaboratorsQuery, () => ({
  projectId: projectId.value
}))
const { result: workspaceResult } = useQuery(
  projectPageCollaboratorWorkspaceQuery,
  () => ({
    workspaceId: pageResult.value!.project.workspace!.id
  }),
  () => ({
    enabled: isWorkspacesEnabled.value && !!pageResult.value?.project.workspace?.id
  })
)

const showInviteDialog = ref(false)
const loading = ref(false)

const canEdit = computed(() => isOwner.value && !isServerGuest.value)
const canInvite = computed(() =>
  workspace?.value?.id ? projectRole.value !== Roles.Stream.Reviewer : isOwner.value
)
const project = computed(() => pageResult.value?.project)
const workspace = computed(() => workspaceResult.value?.workspace)
const projectRole = computed(() => project.value?.role)
const updateRole = useUpdateUserRole(project)
const { collaboratorListItems, isOwner, isServerGuest } = useTeamInternals(
  project,
  workspace
)

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
