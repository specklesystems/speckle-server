<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    :buttons="dialogButtons"
    prevent-close-on-click-outside
    title="Feedback Option"
    hide-closer
  >
    <p>
      Want to share your thoughts later? The Feedback option is always available in your
      <strong>Profile Menu.</strong>
    </p>
  </LayoutDialog>
</template>

<script setup lang="ts">
const isOpen = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{ 'skip-dialog-dismissed': [] }>()

const dialogButtons = computed(() => [
  {
    text: 'OK',
    props: { color: 'default', fullWidth: true, outline: true },
    onClick: () => {
      emit('skip-dialog-dismissed')
    }
  }
])
</script>
