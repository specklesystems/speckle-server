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
        :model-value="localOldRole"
        fully-control-value
        :disabled-items="disabledItems"
        @update:model-value="(value: ValueType) => handleRoleUpdate(value)"
      />
      <div class="flex flex-col items-start gap-1 text-xs">
        <div
          v-for="(message, i) in getWorkspaceProjectRoleMessages(localOldRole)"
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

type ValueType = WorkspaceRoles | WorkspaceRoles[] | undefined

const emit = defineEmits<{
  (e: 'updateRole', newRole: WorkspaceRoles): void
}>()

const props = defineProps<{
  name: string
  oldRole: WorkspaceRoles
  workspaceDomainPolicyCompliant: boolean
}>()

const open = defineModel<boolean>('open', { required: true })

const localOldRole = ref(props.oldRole)

const disabledItems = computed<WorkspaceRoles[]>(() =>
  !props.workspaceDomainPolicyCompliant
    ? [Roles.Workspace.Member, Roles.Workspace.Admin]
    : []
)

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
      emit('updateRole', localOldRole.value)
    }
  }
])

const handleRoleUpdate = (value: ValueType) => {
  if (typeof value === 'string') {
    localOldRole.value = value
  } else if (Array.isArray(value) && value.length > 0) {
    localOldRole.value = value[0]
  } else {
    localOldRole.value = 'workspace:member'
  }
}

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

watch(open, (isOpen) => {
  if (isOpen) {
    localOldRole.value = props.oldRole
  }
})
</script>
