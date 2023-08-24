<template>
  <div class="flex flex-col space-y-4">
    <div class="h4 font-bold flex items-center space-x-2">
      <UsersIcon class="w-6 h-6" />
      <span>Team</span>
    </div>
    <div class="flex flex-col space-y-4">
      <div
        v-for="collaborator in collaboratorListItems"
        :key="collaborator.id"
        class="flex items-center space-x-2"
      >
        <UserAvatar :user="collaborator.user" />
        <span class="grow truncate">{{ collaborator.title }}</span>

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
          <span v-else class="shrink-0">
            {{ roleSelectItems[collaborator.role].title }}
          </span>
        </template>
        <template v-else-if="canEdit">
          <span class="shrink-0 text-foreground-2">
            {{ roleSelectItems[collaborator.role].title }}
          </span>
          <FormButton
            class="shrink-0"
            color="danger"
            size="xs"
            :disabled="loading"
            @click="
              cancelInvite({
                projectId: project.id,
                inviteId: collaborator.inviteId || ''
              })
            "
          >
            Cancel Invite
          </FormButton>
        </template>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Nullable, StreamRoles, Roles } from '@speckle/shared'
import { useApolloClient } from '@vue/apollo-composable'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import {
  Project,
  ProjectPageTeamDialogFragment
} from '~~/lib/common/generated/gql/graphql'
import {
  getCacheId,
  getObjectReference,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import {
  useCancelProjectInvite,
  useUpdateUserRole
} from '~~/lib/projects/composables/projectManagement'
import { useTeamDialogInternals } from '~~/lib/projects/composables/team'
import {
  ProjectCollaboratorListItem,
  roleSelectItems
} from '~~/lib/projects/helpers/components'
import { UsersIcon } from '@heroicons/vue/24/solid'
import { useMixpanel } from '~~/lib/core/composables/mp'

const props = defineProps<{
  project: ProjectPageTeamDialogFragment
}>()

const apollo = useApolloClient().client
const updateRole = useUpdateUserRole()
const cancelInvite = useCancelProjectInvite()
const { activeUser } = useActiveUser()
const { collaboratorListItems, isOwner, isServerGuest } = useTeamDialogInternals({
  props: toRefs(props)
})
const mp = useMixpanel()

const loading = ref(false)

const canEdit = computed(() => isOwner.value && !isServerGuest.value)

const onCollaboratorRoleChange = async (
  collaborator: ProjectCollaboratorListItem,
  newRole: Nullable<StreamRoles>
) => {
  if (collaborator.inviteId) return

  loading.value = true
  await updateRole({
    projectId: props.project.id,
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
      getCacheId('Project', props.project.id),
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
</script>
