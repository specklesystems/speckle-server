<template>
  <LayoutDialog
    v-model:open="store.showErrorDialog"
    chromium65-compatibility
    @close="store.showErrorDialog = false"
  >
    <template #header>
      <div class="h5 font-bold">Host App Error</div>
    </template>
    <div class="mt-1 text-foreground-2 text-sm font-normal mx-2">
      <div class="text-s font-bold">{{ store.hostAppError?.message }}</div>
      <div class="text-s font-bold">Stack Trace</div>
      <div class="text-xs">{{ store.hostAppError?.error }}</div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useHostAppStore } from '~/store/hostApp'
const store = useHostAppStore()
</script>
