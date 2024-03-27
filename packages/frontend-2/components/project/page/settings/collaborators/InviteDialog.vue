<template>
  <LayoutDialog v-model:open="isOpen" max-width="md" :buttons="dialogButtons">
    <template #header>Invite to Project</template>
  </LayoutDialog>
</template>
<script setup lang="ts">
const isOpen = defineModel<boolean>('open', { required: true })

const dialogButtons = computed(() => [
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Send',
    props: {
      color: 'primary',
      fullWidth: true,
      outline: true,
      submit: true
    }
  }
])
</script>
