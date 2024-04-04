<template>
  <ProjectPageSettingsBlock title="Collaborators" :icon="UsersIcon">
    <template #introduction>
      <p>Invite new members or edit roles for existing ones.</p>
    </template>
    <template #topButtons>
      <FormButton :icon-left="UserPlusIcon" @click="toggleInviteDialog">
        Invite
      </FormButton>
    </template>

    <div
      class="w-full bg-foundation flex justify-between px-3 pt-3 pb-1.5 rounded-t-md border-b border-outline text-sm font-bold"
    >
      <div>Name</div>
    </div>

    <div class="flex flex-col bg-foundation">
      <div
        v-for="collaborator in collaboratorListItems"
        :key="collaborator.id"
        class="flex items-center gap-2 py-1.5 px-2 border-b border-outline"
      >
        <UserAvatar :user="collaborator.user" size="sm" />
        <span class="grow truncate text-xs">{{ collaborator.title }}</span>

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
          <span v-else class="shrink-0 text-xs">
            {{ roleSelectItems[collaborator.role].title }}
          </span>
        </template>
        <template v-else-if="canEdit">
          <div
            class="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 mb-0.5 sm:mb-0"
          >
            <span class="shrink-0 text-foreground-2 text-xs">
              {{ roleSelectItems[collaborator.role].title }}
            </span>
            <FormButton
              class="shrink-0"
              color="danger"
              size="xs"
              :disabled="loading"
              @click="
                cancelInvite({
                  projectId: projectId,
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

    <ProjectPageInviteDialog v-model:open="showInviteDialog" />
  </ProjectPageSettingsBlock>
</template>
<script setup lang="ts">
import { Roles } from '@speckle/shared'
import type { Nullable, StreamRoles } from '@speckle/shared'
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import type { Project } from '~~/lib/common/generated/gql/graphql'
import { projectSettingsQuery } from '~~/lib/projects/graphql/queries'
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
import { UsersIcon, UserPlusIcon } from '@heroicons/vue/24/outline'
import { useMixpanel } from '~~/lib/core/composables/mp'

const route = useRoute()
const apollo = useApolloClient().client
const updateRole = useUpdateUserRole()
const cancelInvite = useCancelProjectInvite()
const { activeUser } = useActiveUser()
const mp = useMixpanel()

const showInviteDialog = ref(false)
const loading = ref(false)

const projectId = computed(() => route.params.id as string)

const canEdit = computed(() => isOwner.value && !isServerGuest.value)

const { result: pageResult } = useQuery(projectSettingsQuery, () => ({
  projectId: projectId.value
}))

const projectData = computed(() => pageResult.value?.project)

const { collaboratorListItems, isOwner, isServerGuest } = useTeamInternals(projectData)

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
            !t.user ||
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
