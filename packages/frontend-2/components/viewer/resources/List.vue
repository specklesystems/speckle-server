<template>
  <div class="p-2 flex justify-between">
    <div class="text-sm font-bold text-foreground-2">Models</div>
    <div>
      <FormButton size="sm" text :icon-left="PlusIcon">Add Model</FormButton>
    </div>
  </div>
  <div class="p-2 space-y-2">
    <div v-for="(resource, idx) in resources" :key="idx">
      <ViewerResourcesModelCard :model="(resource as ViewerModelResource)" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ViewerModelResource } from '~~/lib/viewer/services/route'
import { PlusIcon } from '@heroicons/vue/24/solid'
import { useViewerRouteResources } from '~~/lib/viewer/composables/viewer'

const { resources } = useViewerRouteResources()
</script>
