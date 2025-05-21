<template>
  <LayoutDialog v-model:open="open" max-width="sm">
    <template #header>Choose workspace for a new project</template>
  </LayoutDialog>
</template>
<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })
</script>
