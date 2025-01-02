<template>
  <LayoutDialog v-model:open="isOpen" :buttons="dialogButtons" max-width="md">
    <template #header>Cancel invite</template>
    <p class="text-foreground text-body-xs">
      Are you sure you want to cancel the invite for
      <span class="font-medium">{{ email }}</span>
      <span>?</span>
    </p>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'

const emit = defineEmits<{
  (e: 'onCancelInvite'): void
}>()

defineProps<{
  email: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Close',
    props: { color: 'outline' },
    onClick: () => (isOpen.value = false)
  },
  {
    text: 'Cancel invite',
    props: {
      submit: true
    },
    onClick: () => {
      emit('onCancelInvite')
      isOpen.value = false
    }
  }
])
</script>
