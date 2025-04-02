<template>
  <LayoutDialog v-model:open="open" max-width="xs" :buttons="dialogButtons">
    <template #header>Leave workspace?</template>
    <CommonAlert v-if="isOnlyAdmin" color="danger" hide-icon size="xs">
      <template #title>You are the only admin of this workspace</template>
      <template #description>
        <span class="text-body-2xs">
          Please transfer the admin role to another user before leaving the workspace.
        </span>
      </template>
    </CommonAlert>
    <div v-else class="flex flex-col gap-4 mb-4 -mt-1">
      <p>
        You will no longer have access to projects in the
        <span class="font-medium">{{ workspace?.name }}</span>
        workspace.
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useWorkspaceUpdateRole } from '~/lib/workspaces/composables/management'
import type {
  SettingsWorkspacesMembersGuestsTable_WorkspaceFragment,
  SettingsWorkspacesMembersTable_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import { useActiveUser } from '~/lib/auth/composables/activeUser'
import type { MaybeNullOrUndefined } from '@speckle/shared'

const props = defineProps<{
  workspace: MaybeNullOrUndefined<
    | SettingsWorkspacesMembersTable_WorkspaceFragment
    | SettingsWorkspacesMembersGuestsTable_WorkspaceFragment
  >
  isOnlyAdmin: boolean
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const open = defineModel<boolean>('open', { required: true })

const { activeUser } = useActiveUser()
const updateUserRole = useWorkspaceUpdateRole()

const handleConfirm = async () => {
  if (!props.workspace?.id || !activeUser.value?.id) return

  await updateUserRole({
    userId: activeUser.value.id,
    role: null,
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
    text: 'Leave',
    onClick: handleConfirm,
    disabled: props.isOnlyAdmin
  }
])
</script>
