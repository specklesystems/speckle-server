<template>
  <div v-if="hasLock">
    <ClientOnly>
      <SingletonToastManager />
    </ClientOnly>
    <SingletonAppErrorStateManager />
  </div>
  <div v-else />
</template>
<script setup lang="ts">
// This just wraps all global singleton/manager components that should be always available in all layouts
import { useLock } from '~~/lib/common/composables/singleton'

// Protection against component being mounted multiple times
const { hasLock } = useLock('SingletonManagers')
</script>
