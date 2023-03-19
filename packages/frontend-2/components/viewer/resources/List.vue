<template>
  <div>
    <div
      class="bg-foundation xxxoverflow-hidden flex flex-col space-y-1 rounded-lg shadow"
    >
      <div
        class="bg-foundation-2 sticky top-0 z-30 flex h-10 items-center justify-between rounded-t-lg px-2 shadow-md"
      >
        <div>
          <FormButton
            size="xs"
            text
            :icon-left="PlusIcon"
            :disabled="showRemove"
            @click="open = true"
          >
            Add
          </FormButton>
          <FormButton
            size="xs"
            text
            :color="showRemove ? 'primary' : 'secondary'"
            :icon-left="showRemove ? CheckIcon : MinusIcon"
            :disabled="modelsAndVersionIds.length <= 1"
            @click="showRemove = !showRemove"
          >
            {{ showRemove ? 'Done' : 'Remove' }}
          </FormButton>
        </div>
      </div>
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
              @remove="(id) => removeResource(id as unknown as string)"
            />
          </div>
        </template>
      </div>
    </div>
    <ViewerResourcesAddModelDialog v-model:open="open" />
  </div>
</template>
<script setup lang="ts">
import { SpeckleViewer } from '@speckle/shared'
import {
  useInjectedViewerLoadedResources,
  useInjectedViewerRequestedResources
} from '~~/lib/viewer/composables/setup'
import { PlusIcon, CheckIcon, MinusIcon } from '@heroicons/vue/24/solid'

const showRemove = ref(false)
const { resourceItems, modelsAndVersionIds } = useInjectedViewerLoadedResources()

const { items } = useInjectedViewerRequestedResources()

const open = ref(false)

const removeResource = (id: string) => {
  const remaining = items.value.filter((x) => {
    if (x.type === SpeckleViewer.ViewerRoute.ViewerResourceType.Model)
      return (x as SpeckleViewer.ViewerRoute.ViewerModelResource).modelId !== id
    else if (x.type === SpeckleViewer.ViewerRoute.ViewerResourceType.Object)
      return (x as SpeckleViewer.ViewerRoute.ViewerObjectResource).objectId !== id
    else return true
  })

  items.value = [...remaining]
}

watch(modelsAndVersionIds, (newVal) => {
  if (newVal.length <= 1) showRemove.value = false
})
</script>
