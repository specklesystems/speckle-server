<template>
  <LayoutDialog v-model:open="open" max-width="xs" :buttons="dialogButtons">
    <template #header>{{ title ?? 'Discard changes?' }}</template>
    <slot />
    <p v-if="text" class="mb-2">{{ text }}</p>
    <p v-else-if="!$slots.default" class="mb-2">
      You have unsaved changes. Are you sure you want to leave?
    </p>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'

const props = defineProps<{
  title?: string
  text?: string
  confirmText?: string
}>()

const emit = defineEmits(['confirm'])

const open = defineModel<boolean>('open', { required: true })

const dialogButtons = computed((): LayoutDialogButton[] => {
  return [
    {
      text: 'Cancel',
      props: { color: 'outline' },
      onClick: () => {
        open.value = false
      }
    },
    {
      text: props.confirmText ?? 'Confirm',
      onClick: () => {
        open.value = false
        emit('confirm')
      }
    }
  ]
})
</script>
