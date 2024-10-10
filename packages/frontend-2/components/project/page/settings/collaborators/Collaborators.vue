<template>
  <ProjectPageSettingsBlock title="Collaborators">
    <template #introduction>
      <p class="text-body-xs text-foreground">
        Invite new collaborators and set permissions.
      </p>
    </template>
    <template #top-buttons>
      <FormButton @click="toggleInviteDialog">Invite</FormButton>
    </template>

    <div class="flex flex-col mt-6">
      <ProjectPageSettingsCollaboratorsRow
        v-for="collaborator in collaboratorListItems"
        :key="collaborator.id"
        :can-edit="canEdit"
        :collaborator="collaborator"
        :loading="loading"
        @cancel-invite="onCancelInvite"
        @change-role="onCollaboratorRoleChange"
      />
    </div>

    <ProjectPageInviteDialog
      v-if="project"
      v-model:open="showInviteDialog"
      :project="project"
      :project-id="projectId"
      :disabled="!isOwner"
    />
  </ProjectPageSettingsBlock>
</template>
<script setup lang="ts">
import type { Project } from '~~/lib/common/generated/gql/graphql'
import type { ProjectCollaboratorListItem } from '~~/lib/projects/helpers/components'
import type { Nullable, StreamRoles } from '@speckle/shared'
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

const projectPageSettingsCollaboratorsQuery = graphql(`
  query ProjectPageSettingsCollaborators($projectId: String!) {
    project(id: $projectId) {
      id
      ...ProjectPageTeamInternals_Project
      ...ProjectPageInviteDialog_Project
    }
  }
`)

const projectPageSettingsCollaboratorWorkspaceQuery = graphql(`
  query ProjectPageSettingsCollaboratorsWorkspace($workspaceId: String!) {
    workspace(id: $workspaceId) {
      ...ProjectPageTeamInternals_Workspace
    }
  }
`)

const route = useRoute()
const isWorkspacesEnabled = useIsWorkspacesEnabled()
const apollo = useApolloClient().client
const mp = useMixpanel()
const cancelInvite = useCancelProjectInvite()

const showInviteDialog = ref(false)
const loading = ref(false)

const projectId = computed(() => route.params.id as string)

const { result: pageResult } = useQuery(projectPageSettingsCollaboratorsQuery, () => ({
  projectId: projectId.value
}))
const { result: workspaceResult } = useQuery(
  projectPageSettingsCollaboratorWorkspaceQuery,
  () => ({
    workspaceId: pageResult.value!.project.workspaceId!
  }),
  () => ({
    enabled: isWorkspacesEnabled.value && !!pageResult.value?.project.workspaceId
  })
)

const project = computed(() => pageResult.value?.project)
const workspace = computed(() => workspaceResult.value?.workspace)
const updateRole = useUpdateUserRole(project)

const toggleInviteDialog = () => {
  showInviteDialog.value = true
}

const { collaboratorListItems, isOwner, isServerGuest } = useTeamInternals(
  project,
  workspace
)

const canEdit = computed(() => isOwner.value && !isServerGuest.value)

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

  mp.track('Stream Action', {
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
