<template>
  <div
    class="bg-foundation flex items-center gap-2 py-2 px-3 border-t border-x last:border-b border-outline-3 first:rounded-t-lg last:rounded-b-lg"
  >
    <UserAvatar hide-tooltip :user="collaborator.user" />
    <div class="flex gap-x-2 flex-1">
      <span class="truncate text-body-xs">
        {{ collaborator.title }}
        <span v-if="isYou" class="text-foreground-3 text-body-3xs">(you)</span>
      </span>
      <div>
        <CommonBadge v-if="badgeText" rounded color="secondary">
          {{ badgeText }}
        </CommonBadge>
      </div>
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
        :disabled-roles="disabledRoles"
        :disabled-item-tooltip="disabledRolesTooltip"
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

    <InviteDialogCancelInvite
      v-model:open="showCancelInviteDialog"
      :email="collaborator.title"
      @on-cancel-invite="cancelInvite"
    />
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
const showCancelInviteDialog = ref(false)

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

const badgeText = computed(() => {
  if (props.collaborator.inviteId) {
    return 'Pending'
  }
  if (props.collaborator.workspaceRole === Roles.Workspace.Guest) {
    return 'Guest'
  }

  return null
})

const isYou = computed(() => props.collaborator.user?.id === activeUser.value?.id)
const disabledRoles = computed(() => {
  if (props.collaborator.seatType === 'viewer') {
    return [Roles.Stream.Owner, Roles.Stream.Contributor]
  }

  if (isTargettingWorkspaceGuest.value) {
    return [Roles.Stream.Owner]
  }

  return []
})

const disabledRolesTooltip = computed(() => {
  if (props.collaborator.seatType === 'viewer') {
    return 'Users with a viewer seat cannot be project owners or contributors'
  }

  if (isTargettingWorkspaceGuest.value) {
    return 'Workspace guests cannot be project owners'
  }

  return ''
})

const onActionChosen = (
  params: { item: LayoutMenuItem; event: MouseEvent },
  collaborator: ProjectCollaboratorListItem
) => {
  const { item } = params

  switch (item.id) {
    case ActionTypes.Remove:
      if (collaborator.inviteId) {
        showCancelInviteDialog.value = true
      } else {
        emit('changeRole', collaborator, null)
      }
      break
  }
}

const cancelInvite = () => {
  if (props.collaborator.inviteId) {
    emit('cancelInvite', props.collaborator.inviteId)
  }
}
</script>
