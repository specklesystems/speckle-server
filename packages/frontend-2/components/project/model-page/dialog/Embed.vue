<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="md"
    :buttons="[
      {
        text: 'Cancel',
        props: { color: 'invert', fullWidth: true },
        onClick: () => (isOpen = false)
      },
      {
        text: 'Copy',
        props: { color: 'primary', fullWidth: true }
      }
    ]"
  >
    <template #header>Embed Model</template>
    <div>content</div>
  </LayoutDialog>
</template>
<script setup lang="ts">
const isOpen = defineModel<boolean>('open', { required: true })
</script>
