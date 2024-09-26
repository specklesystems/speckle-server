<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    :buttons="dialogButtons"
    title="Workspace description"
  >
    <div class="mb-2">{{ description }}</div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'

defineProps<{
  description: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Close',
    props: { color: 'primary' },
    onClick: () => {
      isOpen.value = false
    }
  }
])
</script>
