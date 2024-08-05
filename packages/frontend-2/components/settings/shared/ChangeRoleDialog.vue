<template>
  <LayoutDialog v-model:open="isOpen" max-width="sm" :buttons="dialogButtons">
    <template #header>Change role</template>
    <div class="flex flex-col gap-4 text-body-xs text-foreground">
      <p>Are you sure you want to change the role of the selected user?</p>
      <div v-if="newRole && oldRole" class="flex flex-col gap-3">
        <div class="flex items-center gap-2 font-semibold">
          {{ name }}
        </div>
        <div class="flex gap-2 items-center">
          <span>{{ getRoleLabel(oldRole).title }}</span>
          <ArrowRightIcon class="h-4 w-4" />
          <span>{{ getRoleLabel(newRole).title }}</span>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { LayoutDialog, type LayoutDialogButton } from '@speckle/ui-components'
import type { WorkspaceRoles } from '@speckle/shared'
import { ArrowRightIcon } from '@heroicons/vue/24/outline'
import { getRoleLabel } from '~~/lib/settings/helpers/utils'

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'updateRole'): void
}>()

const props = defineProps<{
  open: boolean
  name: string
  oldRole?: WorkspaceRoles
  newRole?: WorkspaceRoles
}>()

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline', fullWidth: true },
    onClick: () => emit('update:open', false)
  },
  {
    text: 'Update',
    props: { color: 'primary', fullWidth: true },
    onClick: () => {
      emit('update:open', false)
      emit('updateRole')
    }
  }
])
</script>
