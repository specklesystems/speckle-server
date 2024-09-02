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
        v-model="oldRole"
        fully-control-value
        :disabled-items="disabledItems"
      />
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
const oldRole = defineModel<WorkspaceRoles>('oldRole', { required: true })

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
      emit('updateRole', oldRole.value)
    }
  }
])
</script>
