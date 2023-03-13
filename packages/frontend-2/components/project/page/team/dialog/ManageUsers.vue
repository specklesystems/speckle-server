<template>
  <div class="flex flex-col space-y-4">
    <!-- <div class="h4 font-bold">{{ isOwner ? 'Manage Your Team' : 'Team' }}</div> -->
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
            v-if="isOwner && activeUser && collaborator.id !== activeUser.id"
            class="shrink-0"
            :model-value="collaborator.role"
            :disabled="loading"
            @update:model-value="onCollaboratorRoleChange(collaborator, $event)"
            @delete="onCollaboratorRoleChange(collaborator, null)"
          />
          <span v-else class="shrink-0">
            {{ roleSelectItems[collaborator.role].title }}
          </span>
        </template>
        <template v-else-if="isOwner">
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
import { Nullable, StreamRoles } from '@speckle/shared'
import { useApolloClient } from '@vue/apollo-composable'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { ProjectPageTeamDialogFragment } from '~~/lib/common/generated/gql/graphql'
import {
  CacheObjectReference,
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

const props = defineProps<{
  project: ProjectPageTeamDialogFragment
}>()

const apollo = useApolloClient().client
const updateRole = useUpdateUserRole()
const cancelInvite = useCancelProjectInvite()
const { activeUser } = useActiveUser()
const { collaboratorListItems, isOwner } = useTeamDialogInternals({
  props: toRefs(props)
})

const loading = ref(false)

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

  if (!newRole) {
    // Remove from team
    modifyObjectFields<undefined, Array<{ role: string; user: CacheObjectReference }>>(
      apollo.cache,
      getCacheId('Project', props.project.id),
      (fieldName, _variables, value) => {
        if (fieldName !== 'team') return
        return value.filter(
          (t) =>
            t.user.__ref !== getObjectReference('LimitedUser', collaborator.id).__ref
        )
      }
    )
  }
}
</script>
