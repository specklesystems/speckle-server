<template>
  <Teleport to="#toast-portal">
    <GlobalToastRenderer v-model:notification="notification" />
  </Teleport>
</template>

<script setup lang="ts">
import { useGlobalToastManager } from '~~/lib/common/composables/toast'
import { GlobalToastRenderer } from '@speckle/ui-components'

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
