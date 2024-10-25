<template>
  <LayoutDialog v-model:open="open" max-width="xs" :buttons="dialogButtons">
    <template #header>Update role</template>
    <div class="flex flex-col gap-4 mb-4 -mt-1">
      <FormSelectWorkspaceRoles
        v-model="newRole"
        label="New role"
        fully-control-value
        :disabled-items="disabledItems"
        :current-role="currentRole"
        show-label
        show-description
      />
      <div
        v-if="
          workspaceDomainPolicyCompliant === false && newRole !== Roles.Workspace.Guest
        "
        class="flex gap-x-2 items-center"
      >
        <ExclamationCircleIcon class="text-danger w-5 w-4" />
        <p class="text-foreground">
          This user can only have the guest role due to the workspace policy.
        </p>
      </div>
      <div v-if="newRole" class="flex flex-col items-start gap-1 text-xs">
        <div
          v-for="(message, i) in getWorkspaceProjectRoleMessages(newRole)"
          :key="`message-${i}`"
        >
          {{ message }}
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { Roles, type WorkspaceRoles } from '@speckle/shared'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits<{
  (e: 'updateRole', newRole: WorkspaceRoles): void
}>()

const props = defineProps<{
  workspaceDomainPolicyCompliant?: boolean | null
  currentRole?: WorkspaceRoles
}>()

const open = defineModel<boolean>('open', { required: true })
const newRole = ref<WorkspaceRoles | undefined>()

const disabledItems = computed<WorkspaceRoles[]>(() =>
  props.workspaceDomainPolicyCompliant === false
    ? [Roles.Workspace.Member, Roles.Workspace.Admin]
    : []
)

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => (open.value = false)
  },
  {
    text: 'Update',
    props: { color: 'primary', disabled: !newRole.value },
    onClick: () => {
      open.value = false
      if (newRole.value) {
        emit('updateRole', newRole.value)
      }
    }
  }
])

const getWorkspaceProjectRoleMessages = (workspaceRole: WorkspaceRoles): string[] => {
  switch (workspaceRole) {
    case Roles.Workspace.Admin:
      return [
        'Becomes project owner for all existing and new workspace projects.',
        'Cannot be removed or have role changed by project owners.'
      ]

    case Roles.Workspace.Member:
      return [
        'Becomes project viewer for all existing and new workspace projects.',
        'Project owners can change their role or remove them.'
      ]

    case Roles.Workspace.Guest:
      return [
        'Loses access to all existing workspace projects.',
        'Project owners can assign a role or remove them.'
      ]
  }
}

watch(
  () => open.value,
  () => {
    newRole.value = undefined
  }
)
</script>
