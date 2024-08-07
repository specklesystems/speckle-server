<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Remove domain"
    max-width="sm"
    :buttons="dialogButtons"
  >
    Are you sure you want to remove
    <b>{{ domain }}</b>
    from your workspace's verified domains?
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'

const props = defineProps<{
  domain: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const handleRemove = () => {
  console.log(props.domain)
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline', fullWidth: true },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Remove',
    props: {
      fullWidth: true,
      color: 'danger'
    },
    onClick: handleRemove
  }
])
</script>
