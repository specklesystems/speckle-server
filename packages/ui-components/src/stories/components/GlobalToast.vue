<template>
  <ToastRenderer v-model:notification="notification" />
</template>
<script setup lang="ts">
import { computed } from 'vue'
import ToastRenderer from '~~/src/components/global/ToastRenderer.vue'
import { useGlobalToastManager } from '~~/src/stories/composables/toast'

const { currentNotification, dismiss } = useGlobalToastManager()

const notification = computed({
  get: () => currentNotification.value,
  set: (newVal) => {
    if (!newVal) {
      dismiss()
    }
  }
})
</script>
