<template>
  <div class="">
    <div class="flex flex-col space-y-2 mb-2">
      <div v-for="(resource, idx) in resources" :key="idx">
        <!-- TODO: Object resource card -->
        <ViewerResourcesModelCard :model="(resource as ViewerModelResource)" />
      </div>
    </div>
    <button
      class="group flex w-full rounded-md items-center text-primary text-xs px-2 py-1 transition hover:bg-foundation-focus dark:hover:bg-primary-muted"
    >
      +
      <span class="font-bold ml-1">Add Model</span>
    </button>
  </div>
</template>
<script setup lang="ts">
import { ViewerModelResource } from '~~/lib/viewer/helpers'
import { PlusIcon } from '@heroicons/vue/24/solid'
import { Ref } from 'vue'

const { resources } = inject('resources') as {
  resources: Ref<ViewerModelResource[]>
  updateResourceVersion: (resourceId: string, resourceVersion: string) => void
}
</script>
