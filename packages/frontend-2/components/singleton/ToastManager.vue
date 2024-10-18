<template>
  <Teleport to="#toast-portal">
    <GlobalToastRenderer v-model:notifications="notifications" @dismiss="dismiss" />
  </Teleport>
</template>

<script setup lang="ts">
import { useGlobalToastManager } from '~~/lib/common/composables/toast'
import { GlobalToastRenderer } from '@speckle/ui-components'

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
