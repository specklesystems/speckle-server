<template>
  <ViewerLayoutPanel @close="$emit('close')">
    <template #title>Models</template>
    <template #actions>
      <div class="flex gap-x-1.5">
        <FormButton
          size="sm"
          color="outline"
          :icon-left="PlusIcon"
          :disabled="showRemove"
          @click="open = true"
        >
          Add
        </FormButton>
        <FormButton
          size="sm"
          color="outline"
          :icon-left="showRemove ? CheckIcon : MinusIcon"
          :disabled="!removeEnabled"
          @click="showRemove = !showRemove"
        >
          {{ showRemove ? 'Done' : 'Remove' }}
        </FormButton>
      </div>
    </template>
    <div class="flex flex-col space-y-2 px-1 py-2">
      <template v-if="resourceItems.length">
        <div
          v-for="({ model, versionId }, index) in modelsAndVersionIds"
          :key="model.id"
        >
          <ViewerResourcesModelCard
            :model="model"
            :version-id="versionId"
            :last="index === modelsAndVersionIds.length - 1"
            :show-remove="showRemove"
            @remove="(id:string) => removeModel(id)"
          />
        </div>
        <template v-if="objects.length !== 0">
          <ViewerResourcesObjectCard
            v-for="object in objects"
            :key="object.objectId"
            :object="object"
            :show-remove="showRemove"
            @remove="(id:string) => removeModel(id)"
          />
        </template>
      </template>
    </div>
    <ViewerResourcesAddModelDialog v-model:open="open" />
  </ViewerLayoutPanel>
</template>
<script setup lang="ts">
import {
  useInjectedViewerLoadedResources,
  useInjectedViewerRequestedResources
} from '~~/lib/viewer/composables/setup'
import { PlusIcon, CheckIcon, MinusIcon } from '@heroicons/vue/24/solid'
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

const removeEnabled = computed(() => items.value.length > 1)
</script>
