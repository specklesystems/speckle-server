<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>Change role</template>
    <div class="flex flex-col gap-4 text-body-xs text-foreground">
      <p>Are you sure you want to change the role of the selected user?</p>
      <div v-if="newRole && oldRole" class="flex flex-col gap-3">
        <div class="flex items-center gap-2 font-medium">
          {{ name }}
        </div>
        <div class="flex gap-2 items-center">
          <span>{{ getRoleLabel(oldRole).title }}</span>
          <ArrowRightIcon class="h-4 w-4" />
          <span>{{ getRoleLabel(newRole).title }}</span>
        </div>
        <div class="flex flex-col items-start gap-1 text-xs">
          <div
            v-for="(message, i) in getWorkspaceProjectRoleMessages(newRole)"
            :key="`message-${i}`"
          >
            {{ message }}
          </div>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { Roles, type WorkspaceRoles } from '@speckle/shared'
import { ArrowRightIcon } from '@heroicons/vue/24/outline'
import { getRoleLabel } from '~~/lib/settings/helpers/utils'

const emit = defineEmits<{
  (e: 'updateRole'): void
}>()

defineProps<{
  name: string
  oldRole?: WorkspaceRoles
  newRole?: WorkspaceRoles
}>()
const open = defineModel<boolean>('open', { required: true })

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline', fullWidth: true },
    onClick: () => (open.value = false)
  },
  {
    text: 'Update',
    props: { color: 'primary', fullWidth: true },
    onClick: () => {
      open.value = false
      emit('updateRole')
    }
  }
])

const getWorkspaceProjectRoleMessages = (workspaceRole: WorkspaceRoles): string[] => {
  switch (workspaceRole) {
    case Roles.Workspace.Admin: {
      return [
        'They will become a project owner for all existing workspace projects.',
        'They will become a project owner for new projects created in the workspace.',
        'Project owners will not be able to change their workspace project role.',
        'Project owners will not be able to remove them from workspace projects.'
      ]
    }
    case Roles.Workspace.Member: {
      return [
        'They will become a project viewer for all existing workspace projects.',
        'They will become a project viewer for new projects created in the workspace.',
        'Project owners will be able to grant them any role for workspace projects.',
        'Project owners will be able to remove them from workspace projects.'
      ]
    }
    case Roles.Workspace.Guest: {
      return [
        'They will lose access to all existing workspace projects.',
        'Project owners will be able to grant them any role for workspace projects.',
        'Project owners will be able to remove them from workspace projects.'
      ]
    }
  }
}
</script>
