<template>
  <ToastRenderer v-model:notifications="notifications" />
</template>
<script setup lang="ts">
import { computed } from 'vue'
import ToastRenderer from '~~/src/components/global/ToastRenderer.vue'
import { useGlobalToastManager } from '~~/src/stories/composables/toast'

const { currentNotification, dismiss } = useGlobalToastManager()

const notifications = computed({
  get: () => currentNotification.value,
  set: (newVal) => {
    if (!newVal) {
      dismiss(0)
    }
  }
})
</script>
