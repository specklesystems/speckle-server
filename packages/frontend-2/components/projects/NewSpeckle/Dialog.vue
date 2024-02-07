<template>
  <LayoutDialog v-model:open="isOpen" max-width="sm" :buttons="dialogButtons">
    <p>
      Want to share your thoughts later? The Feedback option is always available in your
      <strong>Profile Menu.</strong>
    </p>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const isOpen = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{ 'dialog-dismissed': [] }>()

const dialogButtons = computed(() => [
  {
    text: 'OK',
    props: { color: 'default', fullWidth: true, outline: true },
    onClick: () => {
      emit('dialog-dismissed')
    }
  }
])
</script>
