<template>
  <ViewerLayoutSidePanel>
    <template #title>
      <FormButton
        size="sm"
        color="subtle"
        :icon-left="ArrowLeftIcon"
        class="-ml-2"
        @click="$emit('close')"
      >
        Exit versions
      </FormButton>
    </template>

    <div class="flex flex-col">
      <template v-if="resourceItems.length">
        <div
          v-for="({ model, versionId }, index) in modelsAndVersionIds"
          :key="model.id"
        >
          <ViewerVersionsCard
            :model="model"
            :version-id="versionId"
            :last="index === modelsAndVersionIds.length - 1"
            :show-remove="showRemove"
            @remove="(id: string) => removeModel(id)"
          />
        </div>
        <template v-if="objects.length !== 0">
          <ViewerResourcesObjectCard
            v-for="object in objects"
            :key="object.objectId"
            :object="object"
            :show-remove="showRemove"
            @remove="(id: string) => removeModel(id)"
          />
        </template>
      </template>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center gap-4 h-full">
        <IconVersions class="h-10 w-10 text-foreground-2" />
        <p class="text-body-xs text-foreground-2">No models loaded, yet.</p>
        <FormButton @click="open = true">Add model</FormButton>
      </div>
    </div>

    <ViewerResourcesAddModelDialog v-model:open="open" />
  </ViewerLayoutSidePanel>
</template>

<script setup lang="ts">
import {
  useInjectedViewerLoadedResources,
  useInjectedViewerRequestedResources
} from '~~/lib/viewer/composables/setup'
import { ArrowLeftIcon } from '@heroicons/vue/24/solid'
import { SpeckleViewer } from '@speckle/shared'
import { useMixpanel } from '~~/lib/core/composables/mp'

defineEmits(['close'])

const showRemove = ref(false)
const { resourceItems, modelsAndVersionIds, objects } =
  useInjectedViewerLoadedResources()
const { items } = useInjectedViewerRequestedResources()

const open = ref(false)

const mp = useMixpanel()

const removeModel = async (modelId: string) => {
  // Convert requested resource string to references to specific models
  // to ensure remove works even when we have "all" or "$folder" in the URL
  const builder = SpeckleViewer.ViewerRoute.resourceBuilder()
  for (const loadedResource of resourceItems.value) {
    if (loadedResource.modelId) {
      if (loadedResource.modelId !== modelId) {
        builder.addModel(loadedResource.modelId, loadedResource.versionId || undefined)
      }
    } else {
      if (loadedResource.objectId !== modelId)
        builder.addObject(loadedResource.objectId)
    }
  }
  mp.track('Viewer Action', { type: 'action', name: 'federation', action: 'remove' })
  await items.update(builder.toResources())
}

watch(modelsAndVersionIds, (newVal) => {
  if (newVal.length <= 1) showRemove.value = false
})
</script>
