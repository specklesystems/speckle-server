<template>
  <div>
    <ViewerModelsVersions v-if="showVersions" @close="showVersions = false" />
    <ViewerLayoutSidePanel v-else>
      <template #title>
        <FormButton
          v-if="showRemove"
          :icon-left="ChevronLeftIcon"
          color="subtle"
          class="-ml-3"
          @click="showRemove = false"
        >
          Exit
        </FormButton>
        <span v-else>Models</span>
      </template>
      <template #actions>
        <ViewerModelsActions
          v-if="!showRemove"
          :remove-enabled="removeEnabled"
          :show-remove="showRemove"
          @show-versions="showVersions = true"
          @remove="handleRemove()"
          @add-model="open = true"
        />
      </template>

      <div class="flex flex-col h-full">
        <template v-if="resourceItems.length">
          <!-- Models with Scene Explorer -->
          <div
            v-for="({ model, versionId }, index) in modelsAndVersionIds"
            :key="model.id"
          >
            <ViewerModelsCard
              :model="model"
              :version-id="versionId"
              :last="index === modelsAndVersionIds.length - 1"
              :show-remove="showRemove"
              :expand-level="expandLevel"
              :manual-expand-level="manualExpandLevel"
              :root-nodes="getRootNodesForModel(model.id)"
              @remove="(id: string) => removeModel(id)"
              @expanded="(e: number) => (manualExpandLevel < e ? (manualExpandLevel = e) : '')"
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

          <!-- Dev Mode -->
          <ViewerDataviewerPanel v-if="showRaw" class="pointer-events-auto" />
        </template>

        <!-- Empty State -->
        <div v-else class="flex flex-col items-center justify-center gap-4 h-full">
          <IconViewerModels v-if="!showVersions" class="h-10 w-10 text-foreground-2" />
          <IconVersions v-else class="h-10 w-10 text-foreground-2" />
          <p class="text-body-xs text-foreground-2">No models loaded, yet.</p>
          <FormButton @click="open = true">Add model</FormButton>
        </div>
      </div>

      <ViewerResourcesAddModelDialog v-model:open="open" />
    </ViewerLayoutSidePanel>
  </div>
</template>

<script setup lang="ts">
import {
  useInjectedViewerLoadedResources,
  useInjectedViewerRequestedResources,
  useInjectedViewer,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { SpeckleViewer } from '@speckle/shared'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { ViewerEvent } from '@speckle/viewer'
import { useViewerEventListener } from '~~/lib/viewer/composables/viewer'
import type { ExplorerNode } from '~~/lib/viewer/helpers/sceneExplorer'
import { sortBy, flatten } from 'lodash-es'
import { ChevronLeftIcon } from '@heroicons/vue/24/solid'

defineEmits(['close'])

const showRemove = ref(false)
const showVersions = ref(false)
const { resourceItems, modelsAndVersionIds, objects } =
  useInjectedViewerLoadedResources()
const { items } = useInjectedViewerRequestedResources()
const {
  metadata: { worldTree }
} = useInjectedViewer()
const {
  resources: {
    response: { resourceItems: stateResourceItems }
  }
} = useInjectedViewerState()

const open = ref(false)
const expandLevel = ref(-1)
const manualExpandLevel = ref(-1)
const showRaw = ref(false)

const mp = useMixpanel()

const removeEnabled = computed(() => items.value.length > 1)

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

const getRootNodesForModel = (modelId: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  refhack.value

  if (!worldTree.value) return []

  const rootNodes = worldTree.value._root.children as ExplorerNode[]
  const results: Record<number, ExplorerNode[]> = {}
  const unmatchedNodes: ExplorerNode[] = []

  for (const node of rootNodes) {
    const objectId = ((node.model as Record<string, unknown>).id as string)
      .split('/')
      .reverse()[0] as string
    const resourceItemIdx = stateResourceItems.value.findIndex(
      (res) => res.objectId === objectId
    )
    const resourceItem =
      resourceItemIdx !== -1 ? stateResourceItems.value[resourceItemIdx] : null

    const raw = node.model?.raw as Record<string, unknown>
    if (resourceItem?.modelId) {
      // Model resource
      const model = modelsAndVersionIds.value.find(
        (item) => item.model.id === resourceItem.modelId
      )?.model
      raw.name = model?.name
      raw.type = model?.id

      // Only include nodes for this specific model
      if (resourceItem.modelId === modelId) {
        const res = node.model as ExplorerNode
        if (resourceItem) {
          ;(results[resourceItemIdx] = results[resourceItemIdx] || []).push(res)
        } else {
          unmatchedNodes.push(res)
        }
      }
    } else {
      raw.name = 'Object'
      raw.type = 'Single object'

      // For single objects, include if the objectId matches
      if (resourceItem && resourceItem.objectId === modelId) {
        const res = node.model as ExplorerNode
        unmatchedNodes.push(res)
      }
    }
  }

  const nodes = [
    ...flatten(sortBy(Object.entries(results), (i) => i[0]).map((i) => i[1])),
    ...unmatchedNodes
  ]

  return nodes
}

const handleRemove = () => {
  showRemove.value = true
}

watch(modelsAndVersionIds, (newVal) => {
  if (newVal.length <= 1) showRemove.value = false
})
</script>
