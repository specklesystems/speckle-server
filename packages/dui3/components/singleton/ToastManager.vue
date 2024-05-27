<template>
  <GlobalToastRenderer v-model:notification="hostAppStore.currentNotification" />
</template>
<script setup lang="ts">
import { GlobalToastRenderer } from '@speckle/ui-components'
import { useHostAppStore } from '~/store/hostApp'

const hostAppStore = useHostAppStore()
</script>
