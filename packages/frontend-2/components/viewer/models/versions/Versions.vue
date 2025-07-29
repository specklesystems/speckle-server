<template>
  <ViewerCompareChangesPanel
    v-if="showDiff"
    :clear-on-back="false"
    @close="handleDiffClose"
  />
  <ViewerLayoutSidePanel v-else>
    <template #title>
      <FormButton
        :icon-left="ChevronLeftIcon"
        color="subtle"
        class="-ml-3"
        @click="handleClose"
      >
        Exit versions
      </FormButton>
    </template>

    <div class="flex flex-col h-full">
      <template v-if="resourceItems.length">
        <div
          v-for="({ model, versionId }, index) in modelsAndVersionIds"
          :key="model.id"
        >
          <ViewerModelsVersionsCard
            :model="model"
            :version-id="versionId"
            :last="index === modelsAndVersionIds.length - 1"
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
import { ChevronLeftIcon } from '@heroicons/vue/24/solid'
import { useDiffUtilities } from '~~/lib/viewer/composables/ui'

const emit = defineEmits(['close'])

const { resourceItems, modelsAndVersionIds, objects } =
  useInjectedViewerLoadedResources()
const { items } = useInjectedViewerRequestedResources()
const {
  ui: { diff: diffState }
} = useInjectedViewerState()
const { endDiff } = useDiffUtilities()

const mp = useMixpanel()

const showDiff = ref(false)

const hasDiffActive = computed(() => {
  return !!(diffState.oldVersion.value && diffState.newVersion.value)
})

// Watch for diff becoming active and show it
watch(
  hasDiffActive,
  (newVal) => {
    if (newVal) {
      showDiff.value = true
    }
  },
  { immediate: true }
)

const handleDiffClose = async () => {
  showDiff.value = false
  if (hasDiffActive.value) {
    await endDiff()
  }
}

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
