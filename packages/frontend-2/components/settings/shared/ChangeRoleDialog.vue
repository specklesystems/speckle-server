<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>Change role</template>
    <div class="flex flex-col gap-4 text-body-xs text-foreground">
      <p>
        Select a new role for
        <strong>{{ name }}</strong>
        :
      </p>
      <FormSelectWorkspaceRoles
        v-model="newRole"
        fully-control-value
        :disabled-items="disabledItems"
      />
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

const emit = defineEmits<{
  (e: 'updateRole', newRole: WorkspaceRoles): void
}>()

const props = defineProps<{
  name: string
  workspaceDomainPolicyCompliant: boolean
}>()

const open = defineModel<boolean>('open', { required: true })
const newRole = ref<WorkspaceRoles | undefined>()

const disabledItems = computed<WorkspaceRoles[]>(() =>
  !props.workspaceDomainPolicyCompliant
    ? [Roles.Workspace.Member, Roles.Workspace.Admin]
    : []
)

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline', fullWidth: true },
    onClick: () => ((open.value = false), (newRole.value = undefined))
  },
  {
    text: 'Update',
    props: { color: 'primary', fullWidth: true, disabled: !newRole.value },
    onClick: () => {
      open.value = false
      if (newRole.value) {
        emit('updateRole', newRole.value)
      }
      newRole.value = undefined
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
