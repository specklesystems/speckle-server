<template>
  <div
    class="bg-foundation flex items-center gap-2 py-2 px-3 border-t border-x last:border-b border-outline-3 first:rounded-t-lg last:rounded-b-lg"
  >
    <UserAvatar hide-tooltip :user="collaborator.user" />
    <div class="flex gap-x-2 flex-1 items-center">
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
        v-if="canEdit && activeUser && collaborator.id !== activeUser.id"
        v-model="role"
        class="shrink-0"
        :disabled="loading"
        :hide-owner="collaborator.serverRole === Roles.Server.Guest"
        :disabled-roles="disabledRoles"
        :disabled-item-tooltip="disabledRolesTooltip"
      />
      <div v-else class="flex items-center justify-end">
        <span v-tippy="roleTooltip" class="shrink-0 text-body-2xs">
          {{ roleSelectItems[collaborator.role].title }}
        </span>
      </div>
    </template>
    <template v-else>
      <div class="flex items-end sm:items-center shrink-0 gap-3">
        <span class="shrink-0 text-body-2xs">
          {{ roleSelectItems[collaborator.role].title }}
        </span>
      </div>
    </template>
    <LayoutMenu
      v-if="canEdit && activeUser && collaborator.id !== activeUser.id"
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
        :icon-right="Ellipsis"
        @click="showActionsMenu = !showActionsMenu"
      />
    </LayoutMenu>

    <SettingsWorkspacesMembersActionsUpdateSeatTypeDialog
      v-if="showUpgradeSeatDialog"
      v-model:open="showUpgradeSeatDialog"
      :user="userForDialog"
      :workspace="workspace"
      hide-notifications
      :text="`To update ${userForDialog.user.name}'s project role they need to be on an Editor seat.`"
      @success="onDialogSuccess"
      @cancel="onDialogCancel"
    />

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
import type { Nullable, StreamRoles, MaybeNullOrUndefined } from '@speckle/shared'
import { Roles, SeatTypes } from '@speckle/shared'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import { Ellipsis } from 'lucide-vue-next'
import { roleSelectItems } from '~~/lib/projects/helpers/components'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import type { SettingsWorkspacesMembersTableHeader_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

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
  workspace?: MaybeNullOrUndefined<SettingsWorkspacesMembersTableHeader_WorkspaceFragment>
  loading: boolean
}>()

const { activeUser } = useActiveUser()
const menuId = useId()

const showActionsMenu = ref(false)
const showCancelInviteDialog = ref(false)
const showUpgradeSeatDialog = ref(false)
const role = ref<StreamRoles>(props.collaborator.role as StreamRoles)

const actionsItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title: props.collaborator.inviteId ? 'Cancel invite' : 'Remove from project',
      id: ActionTypes.Remove,
      disabled: props.loading
    }
  ]
])

const isYou = computed(() => props.collaborator.user?.id === activeUser.value?.id)
const isPending = computed(() => !!props.collaborator.inviteId)
const isWorkspaceGuest = computed(
  () => props.collaborator.workspaceRole === Roles.Workspace.Guest
)
const isWorkspaceAdmin = computed(
  () => props.collaborator.workspaceRole === Roles.Workspace.Admin
)

const userForDialog = computed(() => ({
  id: props.collaborator.id,
  role: props.collaborator.role,
  seatType: props.collaborator.seatType,
  user: {
    name: props.collaborator.user?.name || ''
  }
}))

const roleTooltip = computed(() =>
  isYou.value && !props.canEdit ? "You can't change your own role" : null
)

const badgeText = computed(() => {
  if (isPending.value) {
    return 'Pending'
  }
  if (isWorkspaceGuest.value) {
    return 'Guest'
  }

  return null
})

const disabledRoles = computed(() => {
  if (isWorkspaceAdmin.value) {
    return [Roles.Stream.Contributor, Roles.Stream.Reviewer]
  }

  if (props.collaborator.seatType === 'viewer') {
    if (isPending.value || !props.canEdit) {
      return [Roles.Stream.Owner, Roles.Stream.Contributor]
    }
  }

  if (isWorkspaceGuest.value) {
    return [Roles.Stream.Owner]
  }

  return []
})

const disabledRolesTooltip = computed(() => {
  if (isWorkspaceAdmin.value) {
    return "Admin roles can't be changed"
  }

  if (props.collaborator.seatType === 'viewer') {
    if (isPending.value || !props.canEdit) {
      return 'Users with a viewer seat cannot be project owners or contributors'
    }
  }

  if (isWorkspaceGuest.value) {
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

const onRoleChange = (newRole: StreamRoles) => {
  if (
    props.collaborator.seatType === SeatTypes.Viewer &&
    newRole !== Roles.Stream.Reviewer
  ) {
    showUpgradeSeatDialog.value = true
    return
  }
  emit('changeRole', props.collaborator, newRole)
}

const onDialogSuccess = () => {
  showUpgradeSeatDialog.value = false
  emit('changeRole', props.collaborator, role.value)
}

const onDialogCancel = () => {
  role.value = props.collaborator.role as StreamRoles
  showUpgradeSeatDialog.value = false
}

const cancelInvite = () => {
  if (props.collaborator.inviteId) {
    emit('cancelInvite', props.collaborator.inviteId)
  }
}

watch(role, (newRole: StreamRoles) => {
  if (newRole !== props.collaborator.role) {
    onRoleChange(newRole)
  }
})
</script>
