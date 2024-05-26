<template>
  <GlobalToastRenderer v-model:notification="currentNotification" />
</template>
<script setup lang="ts">
import { Nullable } from '@speckle/shared'
import { GlobalToastRenderer, ToastNotification } from '@speckle/ui-components'
import { useHostAppStore } from '~/store/hostApp'

const hostAppStore = useHostAppStore()

const currentNotification = computed({
  get: () => hostAppStore.currentNotification,
  set: (val: Nullable<ToastNotification>) => hostAppStore.setNotification(val)
})
</script>
