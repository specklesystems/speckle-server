<template>
  <LayoutDialog
    v-model:open="open"
    max-width="xs"
    title="Data residency notice"
    :buttons="dialogButtons"
  >
    The selected workspace has a custom data residency setup. However, we currently do
    not support moving projects between regions; therefore, the project data will remain
    in its previous location.
  </LayoutDialog>
</template>
<script lang="ts" setup>
import type { LayoutDialogButton } from '@speckle/ui-components'

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()

const open = defineModel<boolean>('open', { required: true })

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      open.value = false
      emit('cancel')
    }
  },
  {
    text: 'I Understand',
    onClick: () => {
      open.value = false
      emit('confirm')
    }
  }
])
</script>
