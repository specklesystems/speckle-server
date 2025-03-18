<!-- TODO: Check how domain policy interacts with this -->
<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>{{ dialogTitle }}</template>
    <div class="flex flex-col gap-4 mb-4 -mt-1">
      <CommonCard class="bg-foundation-2 !py-4 text-body-2xs">
        <div class="flex flex-row gap-x-2 items-center">
          <UserAvatar hide-tooltip :user="user" />
          {{ user.name }}
        </div>
      </CommonCard>

      <p>{{ mainMessage }}</p>

      <p v-if="showRoleInfo" class="text-foreground-2 text-body-2xs">
        {{ roleInfoMessage }}
      </p>

      <div v-if="showEditorSeatsInfo" class="text-body-2xs text-foreground-2 leading-5">
        {{ editorSeatsMessage }}
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import type { UserItem } from '~/components/settings/workspaces/members/new/MembersTable.vue'
import { UserUpdateActionTypes } from '~/lib/settings/helpers/types'

const props = defineProps<{
  user: UserItem
  type?: UserUpdateActionTypes
}>()

const emit = defineEmits<{
  (e: 'makeAdmin'): void
  (e: 'makeGuest'): void
  (e: 'upgradeEditor'): void
  (e: 'removeUser'): void
}>()

const open = defineModel<boolean>('open', { required: true })

const dialogTitle = computed(() => {
  switch (props.type) {
    case UserUpdateActionTypes.MakeAdmin:
      return 'Make an admin?'
    case UserUpdateActionTypes.MakeGuest:
      return 'Make a guest?'
    case UserUpdateActionTypes.UpgradeEditor:
      return 'Upgrade to an editor seat?'
    default:
      return ''
  }
})

const mainMessage = computed(() => {
  switch (props.type) {
    case UserUpdateActionTypes.MakeAdmin:
      return props.user.seatType === 'editor'
        ? 'They will become project owner for all existing and new workspace projects.'
        : 'They will be given an editor seat and become project owner for all existing and new workspace projects.'
    case UserUpdateActionTypes.MakeGuest:
      return 'They will lose access to all existing workspace projects.'
    case UserUpdateActionTypes.UpgradeEditor:
      return 'An editor seat will allow them to create new models and versions.'
    default:
      return ''
  }
})

const showRoleInfo = computed(
  () =>
    props.type === UserUpdateActionTypes.MakeAdmin ||
    props.type === UserUpdateActionTypes.MakeGuest
)

const roleInfoMessage = computed(() => {
  switch (props.type) {
    case UserUpdateActionTypes.MakeAdmin:
      return 'Admins can edit workspaces, including settings, members and all projects. More about workspace roles.'
    case UserUpdateActionTypes.MakeGuest:
      return "Guest can contribute to projects they're invited to. More about workspace roles."
    default:
      return ''
  }
})

const showEditorSeatsInfo = computed(
  () =>
    (props.type === UserUpdateActionTypes.MakeAdmin &&
      props.user.seatType === 'viewer') ||
    props.type === UserUpdateActionTypes.UpgradeEditor
)

const editorSeatsMessage = computed(() => {
  // TODO: Replace with actual editor seats once backend adds support
  const editor = 0
  const editorLimit = 5
  return `After this, ${
    editor + 1
  } of ${editorLimit} editor seats included in your plan will be used.`
})

const buttonText = computed(() => {
  switch (props.type) {
    case UserUpdateActionTypes.MakeAdmin:
      return 'Make an admin'
    case UserUpdateActionTypes.MakeGuest:
      return 'Make a guest'
    case UserUpdateActionTypes.UpgradeEditor:
      return 'Upgrade to editor'
    default:
      return ''
  }
})

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => (open.value = false)
  },
  {
    text: buttonText.value,
    props: {
      color: 'primary'
    },
    onClick: () => {
      open.value = false
      switch (props.type) {
        case UserUpdateActionTypes.MakeAdmin:
          emit('makeAdmin')
          break
        case UserUpdateActionTypes.MakeGuest:
          emit('makeGuest')
          break
        case UserUpdateActionTypes.UpgradeEditor:
          emit('upgradeEditor')
          break
      }
    }
  }
])
</script>
