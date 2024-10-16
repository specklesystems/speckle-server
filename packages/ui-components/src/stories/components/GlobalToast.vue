<template>
  <ToastRenderer v-model:notifications="notifications" @dismiss="dismiss" />
</template>
<script setup lang="ts">
import { computed } from 'vue'
import ToastRenderer from '~~/src/components/global/ToastRenderer.vue'
import { useGlobalToastManager } from '~~/src/stories/composables/toast'

const { currentNotifications, dismissAll, dismiss } = useGlobalToastManager()

const notifications = computed({
  get: () => currentNotifications.value,
  set: (newVal) => {
    if (!newVal) {
      dismissAll()
    }
  }
})
</script>
