<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>{{ title }}</template>
    <div class="flex flex-col gap-4 mb-4 -mt-1">
      <p>{{ mainMessage }}</p>
      <div class="text-body-2xs text-foreground-2 leading-5">
        {{ editorSeatsMessage }}
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import type { UserItem } from '~/components/settings/workspaces/members/new/MembersTable.vue'
import {
  SeatTypes,
  type WorkspaceSeatType,
  type MaybeNullOrUndefined
} from '@speckle/shared'
import { useWorkspaceUpdateSeatType } from '~/lib/workspaces/composables/management'
import type {
  SettingsWorkspacesMembersNewGuestsTable_WorkspaceFragment,
  SettingsWorkspacesNewMembersTable_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  user: UserItem
  workspace?: MaybeNullOrUndefined<
    | SettingsWorkspacesNewMembersTable_WorkspaceFragment
    | SettingsWorkspacesMembersNewGuestsTable_WorkspaceFragment
  >
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const open = defineModel<boolean>('open', { required: true })

const updateUserSeatType = useWorkspaceUpdateSeatType()

const isUpgrading = computed(() => props.user.seatType === SeatTypes.Viewer)

const title = computed(() => {
  return isUpgrading.value
    ? 'Upgrade to an editor seat?'
    : 'Downgrade to a viewer seat?'
})

const mainMessage = computed(() => {
  return isUpgrading.value
    ? 'An editor seat will allow them to create new models and versions.'
    : 'A viewer seat will allow them to view and receive model, but not send to it.'
})

const editorSeatsMessage = computed(() => {
  // TODO: Replace with actual editor seats once backend adds support
  const editor = 0
  const editorLimit = 5
  return `After this, ${
    editor + 1
  } of ${editorLimit} editor seats included in your plan will be used.`
})

const handleConfirm = async () => {
  if (!props.workspace?.id) return

  const newSeatType: WorkspaceSeatType = isUpgrading.value
    ? SeatTypes.Editor
    : SeatTypes.Viewer

  await updateUserSeatType({
    userId: props.user.id,
    seatType: newSeatType,
    workspaceId: props.workspace.id
  })

  open.value = false
  emit('success')
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => (open.value = false)
  },
  {
    text: isUpgrading.value ? 'Confirm and upgrade' : 'Confirm and downgrade',
    onClick: handleConfirm
  }
])
</script>
