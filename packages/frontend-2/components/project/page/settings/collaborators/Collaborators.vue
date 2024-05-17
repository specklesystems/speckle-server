<template>
  <ProjectPageSettingsBlock title="Collaborators">
    <template #introduction>
      <p>Invite new collaborators and set permissions.</p>
    </template>
    <template #top-buttons>
      <FormButton :icon-left="UserPlusIcon" @click="toggleInviteDialog">
        Invite
      </FormButton>
    </template>

    <div class="flex flex-col mt-6">
      <div
        v-for="collaborator in collaboratorListItems"
        :key="collaborator.id"
        class="bg-foundation flex items-center gap-2 py-3 px-4 border-t border-x last:border-b border-outline-3 first:rounded-t-lg last:rounded-b-lg"
      >
        <UserAvatar :user="collaborator.user" size="sm" />
        <span class="grow truncate text-sm">{{ collaborator.title }}</span>

        <template v-if="!collaborator.inviteId">
          <ProjectPageTeamPermissionSelect
            v-if="canEdit && activeUser && collaborator.id !== activeUser.id"
            class="shrink-0"
            :model-value="collaborator.role"
            :disabled="loading"
            :hide-owner="collaborator.serverRole === Roles.Server.Guest"
            @update:model-value="onCollaboratorRoleChange(collaborator, $event)"
            @delete="onCollaboratorRoleChange(collaborator, null)"
          />
          <span v-else class="shrink-0 text-sm">
            {{ roleSelectItems[collaborator.role].title }}
          </span>
        </template>
        <template v-else-if="canEdit">
          <div class="flex items-end sm:items-center shrink-0 gap-3">
            <span class="shrink-0 text-foreground-2 text-sm">
              {{ roleSelectItems[collaborator.role].title }}
            </span>
            <FormButton
              class="shrink-0"
              color="danger"
              size="xs"
              :disabled="loading"
              @click="
                cancelInvite({
                  projectId,
                  inviteId: collaborator.inviteId || ''
                })
              "
            >
              Cancel Invite
            </FormButton>
          </div>
        </template>
      </div>
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
import { Roles } from '@speckle/shared'
import type { Nullable, StreamRoles } from '@speckle/shared'
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import type { Project } from '~~/lib/common/generated/gql/graphql'
import {
  getCacheId,
  getObjectReference,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import {
  useCancelProjectInvite,
  useUpdateUserRole
} from '~~/lib/projects/composables/projectManagement'
import { useTeamInternals } from '~~/lib/projects/composables/team'
import { roleSelectItems } from '~~/lib/projects/helpers/components'
import type { ProjectCollaboratorListItem } from '~~/lib/projects/helpers/components'
import { UserPlusIcon } from '@heroicons/vue/24/outline'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { graphql } from '~~/lib/common/generated/gql'

const projectPageSettingsCollaboratorsQuery = graphql(`
  query ProjectPageSettingsCollaborators($projectId: String!) {
    project(id: $projectId) {
      id
      ...ProjectPageTeamInternals_Project
      ...ProjectPageInviteDialog_Project
    }
  }
`)

const route = useRoute()
const apollo = useApolloClient().client
const updateRole = useUpdateUserRole()
const cancelInvite = useCancelProjectInvite()
const { activeUser } = useActiveUser()
const mp = useMixpanel()

const showInviteDialog = ref(false)
const loading = ref(false)

const projectId = computed(() => route.params.id as string)

const { result: pageResult } = useQuery(projectPageSettingsCollaboratorsQuery, () => ({
  projectId: projectId.value
}))

const project = computed(() => pageResult.value?.project)

const { collaboratorListItems, isOwner, isServerGuest } = useTeamInternals(project)

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
    action: 'team member role'
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

const toggleInviteDialog = () => {
  showInviteDialog.value = true
}
</script>
