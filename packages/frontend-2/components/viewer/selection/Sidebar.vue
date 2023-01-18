<template>
  <div
    :class="`fixed max-h-[calc(100vh-5.5rem)] top-[4.5rem] px-[2px] right-4 rounded-md mb-4 transition-[width,opacity] ease-in-out duration-75 bg-foundation p-2 overflow-y-auto simple-scrollbar ${
      true ? 'w-80 opacity-100' : 'w-0 opacity-0'
    }`"
  >
    <div class="flex justify-between items-center mb-2">
      <div class="font-bold">Selected Objects</div>
      <FormButton size="xs" :icon-right="XMarkIcon" text>Close</FormButton>
    </div>
    <div>
      <div v-for="object in selection.objects.value">
        <pre class="text-tiny">{{ object }}</pre>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/solid'
import { useInjectedViewerInterfaceState } from '~~/lib/viewer/composables/setup'

const { selection } = useInjectedViewerInterfaceState()
</script>
