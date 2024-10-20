<template>
  <div
    class="bg-foundation flex items-center gap-2 py-2 px-3 border-t border-x last:border-b border-outline-3 first:rounded-t-lg last:rounded-b-lg"
  >
    <UserAvatar hide-tooltip :user="collaborator.user" />
    <div class="flex flex-col grow">
      <span class="truncate text-body-xs">{{ collaborator.title }}</span>
      <span
        v-if="collaborator.inviteId"
        class="truncate text-body-2xs text-foreground-2"
      >
        Pending invite
      </span>
    </div>
    <template v-if="!collaborator.inviteId">
      <ProjectPageTeamPermissionSelect
        v-if="
          canEdit &&
          activeUser &&
          collaborator.id !== activeUser.id &&
          collaborator.workspaceRole !== Roles.Workspace.Admin
        "
        class="shrink-0"
        :model-value="collaborator.role"
        :disabled="loading"
        :hide-owner="collaborator.serverRole === Roles.Server.Guest"
        :disabled-roles="isTargettingWorkspaceGuest ? [Roles.Stream.Owner] : []"
        :disabled-item-tooltip="
          isTargettingWorkspaceGuest ? 'Workspace guests cannot be project owners' : ''
        "
        @update:model-value="emit('changeRole', collaborator, $event)"
      />
      <div v-else class="flex items-center justify-end">
        <span v-tippy="roleTooltip" class="shrink-0 text-body-2xs">
          {{ roleSelectItems[collaborator.role].title }}
        </span>
      </div>
    </template>
    <template v-else-if="canEdit">
      <div class="flex items-end sm:items-center shrink-0 gap-3">
        <span class="shrink-0 text-body-2xs">
          {{ roleSelectItems[collaborator.role].title }}
        </span>
      </div>
    </template>
    <LayoutMenu
      v-if="
        canEdit &&
        activeUser &&
        collaborator.id !== activeUser.id &&
        collaborator.workspaceRole !== Roles.Workspace.Admin
      "
      v-model:open="showActionsMenu"
      :items="actionsItems"
      :menu-position="HorizontalDirection.Left"
      :menu-id="menuId"
      @click.stop.prevent
      @chosen="onActionChosen($event, collaborator)"
    >
      <FormButton
        color="subtle"
        hide-text
        :icon-right="EllipsisHorizontalIcon"
        @click="showActionsMenu = !showActionsMenu"
      />
    </LayoutMenu>
  </div>
</template>

<script setup lang="ts">
import type { ProjectCollaboratorListItem } from '~~/lib/projects/helpers/components'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import type { Nullable, StreamRoles } from '@speckle/shared'
import { Roles } from '@speckle/shared'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import { EllipsisHorizontalIcon } from '@heroicons/vue/24/solid'
import { roleSelectItems } from '~~/lib/projects/helpers/components'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

enum ActionTypes {
  Remove = 'remove'
}

const emit = defineEmits<{
  (e: 'cancelInvite', inviteId: string): void
  (
    e: 'changeRole',
    collaborator: ProjectCollaboratorListItem,
    newRole: Nullable<StreamRoles>
  ): void
}>()

const props = defineProps<{
  canEdit: boolean
  collaborator: ProjectCollaboratorListItem
  loading: boolean
}>()

const { activeUser } = useActiveUser()

const showActionsMenu = ref(false)
const menuId = useId()

const actionsItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title: props.collaborator.inviteId ? 'Cancel invite' : 'Remove user',
      id: ActionTypes.Remove,
      disabled: props.loading
    }
  ]
])

const roleTooltip = computed(() => {
  if (!props.canEdit) {
    return null
  }

  if (props.collaborator.workspaceRole === Roles.Workspace.Admin) {
    return 'User is workspace admin'
  }

  return null
})

const isTargettingWorkspaceGuest = computed(
  () => props.collaborator.workspaceRole === Roles.Workspace.Guest
)

const onActionChosen = (
  params: { item: LayoutMenuItem; event: MouseEvent },
  collaborator: ProjectCollaboratorListItem
) => {
  const { item } = params

  switch (item.id) {
    case ActionTypes.Remove:
      if (collaborator.inviteId) {
        emit('cancelInvite', collaborator.inviteId)
      } else {
        emit('changeRole', collaborator, null)
      }
      break
  }
}
</script>
