<template>
  <LayoutDialog
    v-model:open="open"
    max-width="sm"
    :buttons="dialogButtons"
    hide-closer
    prevent-close-on-click-outside
  >
    <template #header>Create a new region</template>
    watch it bozo
  </LayoutDialog>
</template>
<script lang="ts" setup>
import type { LayoutDialogButton } from '@speckle/ui-components'

const open = defineModel<boolean>('open', { required: true })

const dialogButtons = computed((): LayoutDialogButton[] => {
  return [
    {
      text: 'Cancel',
      props: { color: 'outline' },
      onClick: () => (open.value = false)
    },
    {
      text: 'Create',
      props: {
        submit: true
      },
      onClick: noop
    }
  ]
})
</script>
