<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>Remove member?</template>
    <div class="flex flex-col gap-4 mb-4 -mt-1">
      <CommonCard class="bg-foundation-2 text-body-2xs !p-2">
        <div class="flex flex-row gap-x-2 items-center">
          <UserAvatar
            hide-tooltip
            :user="user"
            light-style
            class="bg-foundation"
            no-bg
          />
          {{ user.name }}
        </div>
      </CommonCard>

      <p>
        They will no longer have access to projects in the
        <span class="font-medium">{{ workspace?.name }}</span>
        workspace.
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import type { UserItem } from '~/components/settings/workspaces/members/new/MembersTable.vue'
import { useWorkspaceUpdateRole } from '~/lib/workspaces/composables/management'
import type {
  SettingsWorkspacesMembersNewGuestsTable_WorkspaceFragment,
  SettingsWorkspacesNewMembersTable_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import type { MaybeNullOrUndefined } from '@speckle/shared'

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

const updateUserRole = useWorkspaceUpdateRole()

const handleConfirm = async () => {
  if (!props.workspace?.id) return

  await updateUserRole({
    userId: props.user.id,
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
    text: 'Remove',
    onClick: handleConfirm
  }
])
</script>
