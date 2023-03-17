<template>
  <div class="space-y-2">
    <template v-if="resourceItems.length">
      <div v-for="{ model, versionId } in modelsAndVersionIds" :key="model.id">
        <ViewerResourcesModelCard2
          :model="model"
          :version-id="versionId"
          @loaded-more="$emit('loaded-more')"
        />
      </div>
      <!-- Basic object cards for now -->
      <div
        v-for="{ objectId } in objects"
        :key="objectId"
        class="px-1 py-2 flex flex-col items-center bg-foundation shadow-md rounded-md"
      >
        <div>Object w/ ID:</div>
        <span>{{ objectId }}</span>
      </div>
    </template>
    <template v-else>No resources loaded</template>
    <FormButton size="sm" full-width @click="open = true">
      Load Another Model
    </FormButton>
    <ViewerResourcesAddModelDialog v-model:open="open" />
  </div>
</template>
<script setup lang="ts">
import { useInjectedViewerLoadedResources } from '~~/lib/viewer/composables/setup'

defineEmits<{
  (e: 'loaded-more'): void
}>()

const { resourceItems, objects, modelsAndVersionIds } =
  useInjectedViewerLoadedResources()

const open = ref(false)
</script>
