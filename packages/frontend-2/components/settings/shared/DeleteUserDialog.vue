<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>Remove user</template>
    <div class="flex flex-col gap-4 text-body-xs text-foreground">
      <p>Are you sure you want to remove the following user from the workspace?</p>
      <p class="font-medium">
        {{ name }}
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'

const emit = defineEmits<{
  (e: 'removeUser'): void
}>()

defineProps<{
  name: string
}>()
const open = defineModel<boolean>('open', { required: true })

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline', fullWidth: true },
    onClick: () => (open.value = false)
  },
  {
    text: 'Remove',
    props: { color: 'primary', fullWidth: true },
    onClick: () => {
      open.value = false
      emit('removeUser')
    }
  }
])
</script>
