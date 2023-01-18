<template>
  <div
    :class="`fixed max-h-[calc(100vh-5.5rem)] top-[4.5rem] px-2 py-1 right-4 rounded-md shadow mb-4 transition-[width,opacity] ease-in-out duration-75 bg-foundation overflow-y-auto simple-scrollbar ${
      objects.length !== 0 ? 'w-80 opacity-100' : 'w-0 opacity-0'
    }`"
  >
    <div class="mb-2">
      <div class="flex justify-between items-center">
        <div class="font-bold">Selected Objects ({{ objects.length }})</div>
        <FormButton size="xs" :icon-right="XMarkIcon" text @click="clearSelection()">
          Clear Selection
        </FormButton>
      </div>
      <div v-if="objects.length === 1" class="text-xs text-foreground-2">
        Hold down "shift" to select multiple objects.
      </div>
    </div>

    <div>
      <div v-for="object in objects.reverse()" :key="(object.id as string)">
        <pre class="text-tiny">{{ object }}</pre>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/solid'
import { useInjectedViewerInterfaceState } from '~~/lib/viewer/composables/setup'

const {
  selection: { objects, clearSelection }
} = useInjectedViewerInterfaceState()
</script>
