<template>
  <ViewerLayoutSidePanel>
    <template #title>
      <div class="flex items-center gap-x-1">
        <FormButton
          :icon-left="ChevronLeft"
          color="subtle"
          class="-ml-3"
          hide-text
          size="sm"
          @click="handleClose"
        >
          Exit versions
        </FormButton>
        Versions
      </div>
    </template>

    <div class="flex flex-col h-full">
      <template v-if="resourceItems.length">
        <!-- Versions with single scroll container for sticky headers -->
        <div class="flex-1 overflow-y-auto simple-scrollbar">
          <div
            v-for="({ model, versionId }, index) in modelsAndVersionIds"
            :key="model.id"
          >
            <ViewerModelsVersionsCard
              :model="model"
              :version-id="versionId"
              :last="index === modelsAndVersionIds.length - 1"
              :initially-expanded="
                props.expandedModelId === model.id || modelsAndVersionIds.length === 1
              "
            />
          </div>
          <template v-if="objects.length !== 0">
            <ViewerResourcesObjectCard
              v-for="object in objects"
              :key="object.objectId"
              :object="object"
              :show-remove="false"
              @remove="(id: string) => removeModel(id)"
            />
          </template>
        </div>
      </template>
    </div>
  </ViewerLayoutSidePanel>
</template>

<script setup lang="ts">
import {
  useInjectedViewerLoadedResources,
  useInjectedViewerRequestedResources,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { SpeckleViewer } from '@speckle/shared'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { ViewerEvent } from '@speckle/viewer'
import { useViewerEventListener } from '~~/lib/viewer/composables/viewer'
import { ChevronLeft } from 'lucide-vue-next'
import { useDiffUtilities } from '~~/lib/viewer/composables/ui'

const props = defineProps<{
  expandedModelId?: string | null
}>()

const emit = defineEmits(['close'])

const { resourceItems, modelsAndVersionIds, objects } =
  useInjectedViewerLoadedResources()
const { items } = useInjectedViewerRequestedResources()
const {
  ui: { diff: diffState }
} = useInjectedViewerState()
const { endDiff } = useDiffUtilities()

const mp = useMixpanel()

const hasDiffActive = computed(() => {
  return !!(diffState.oldVersion.value && diffState.newVersion.value)
})

const handleClose = async () => {
  if (hasDiffActive.value) {
    await endDiff()
  }
  emit('close')
}

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

// TODO: worldTree being set in postSetup.ts (viewer) does not seem to create a reactive effect
// in here (as i was expecting it to?). Therefore, refHack++ to trigger the computed prop rootNodes.
// Possibly Fabs will know more :)
const refhack = ref(1)
useViewerEventListener(ViewerEvent.LoadComplete, () => {
  refhack.value++
})
</script>
