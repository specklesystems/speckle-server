<template>
  <LayoutDialog v-model:open="open" max-width="xs" :buttons="dialogButtons">
    <template #header>{{ title }}</template>
    <div class="flex flex-col gap-4 text-body-xs text-foreground">
      <p>
        Are you sure you want to remove
        <span class="font-medium">
          {{ name }}
        </span>
        from the workspace?
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
  title: string
  name: string
}>()

const open = defineModel<boolean>('open', { required: true })

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => (open.value = false)
  },
  {
    text: 'Remove',
    props: { color: 'primary' },
    onClick: () => {
      open.value = false
      emit('removeUser')
    }
  }
])
</script>
