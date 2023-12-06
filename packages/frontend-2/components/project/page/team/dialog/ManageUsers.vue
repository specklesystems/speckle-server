<template>
  <LayoutDialogSection class="-mt-4" title="Team">
    <template #icon>
      <UsersIcon class="h-full w-full" />
    </template>
    <div class="flex flex-col gap-2">
      <div
        class="flex flex-col border border-primary-muted max-h-40 overflow-auto simple-scrollbar"
      >
        <div
          v-for="collaborator in collaboratorListItems"
          :key="collaborator.id"
          class="flex items-center space-x-2 even:bg-primary-muted py-1.5 px-2"
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
  </LayoutDialogSection>
</template>
<script setup lang="ts">
import { Roles } from '@speckle/shared'
import type { Nullable, StreamRoles } from '@speckle/shared'
import { useApolloClient } from '@vue/apollo-composable'
import { LayoutDialogSection } from '@speckle/ui-components'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import type {
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
import { roleSelectItems } from '~~/lib/projects/helpers/components'
import type { ProjectCollaboratorListItem } from '~~/lib/projects/helpers/components'
import { UsersIcon } from '@heroicons/vue/24/outline'
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
