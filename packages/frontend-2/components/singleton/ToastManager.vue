<template>
  <Teleport to="#toast-portal">
    <GlobalToastRenderer v-model:notifications="notifications" />
  </Teleport>
</template>

<script setup lang="ts">
import { useGlobalToastManager } from '~~/lib/common/composables/toast'
import { GlobalToastRenderer } from '@speckle/ui-components'

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
