<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>Change project permissions</template>
    <div class="flex flex-col gap-4 text-body-xs text-foreground">
      <p>
        Change project permissions for
        <span class="font-medium">name</span>
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'

defineProps<{
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
    text: 'Update',
    props: { color: 'primary' },
    onClick: () => {
      // Add logic to update permissions here
      open.value = false
    }
  }
])
</script>
