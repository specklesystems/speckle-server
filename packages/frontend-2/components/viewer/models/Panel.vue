<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="select-none h-full">
    <div v-show="showVersions">
      <ViewerModelsVersions
        :expanded-model-id="expandedModelId"
        @close="handleVersionsClose"
      />
    </div>
    <ViewerLayoutSidePanel v-show="!showVersions">
      <template #title>
        <span v-if="objects.length === 1">Detached object</span>
        <span v-else-if="objects.length > 1">Detached objects</span>
        <span v-else>Models</span>
      </template>
      <template #actions>
        <ViewerModelsActions
          v-if="!hasObjects"
          :hide-versions="resourceItems.length === 0"
          @show-versions="showVersions = true"
          @add-model="showAddModel = true"
        />
      </template>

      <div class="flex flex-col h-full">
        <template v-if="resourceItems.length">
          <div class="flex-1 simple-scrollbar" v-bind="containerProps">
            <div v-bind="wrapperProps">
              <div
                v-for="{ data: item } in virtualList"
                :key="item.id"
                :data-item-id="item.id"
                class="group"
              >
                <!-- Model Header -->
                <template v-if="item.type === 'model-header'">
                  <div class="sticky top-0 z-20 bg-foundation">
                    <ViewerModelsCard
                      :model="getModelFromItem(item)"
                      :version-id="getVersionIdFromItem(item)"
                      :last="false"
                      :first="item.isFirstModel"
                      :expand-level="expandLevel"
                      :manual-expand-level="manualExpandLevel"
                      :root-nodes="[]"
                      :is-expanded="expandedModels.has(item.modelId)"
                      @toggle-expansion="toggleModelExpansion(item.modelId)"
                      @remove="(id: string) => removeModel(id)"
                      @expanded="(e: number) => (manualExpandLevel < e ? (manualExpandLevel = e) : '')"
                      @show-versions="handleShowVersions"
                      @show-diff="handleShowDiff"
                    />
                  </div>
                </template>

                <!-- Tree Item -->
                <template v-else-if="item.type === 'tree-item'">
                  <ViewerModelsVirtualTreeItem
                    :item="item"
                    @toggle-expansion="toggleTreeItemExpansion"
                    @item-click="handleItemClick"
                  />
                </template>
              </div>
            </div>
          </div>
        </template>

        <!-- Empty State -->
        <div
          v-else
          class="flex flex-col items-center justify-center gap-4 h-full -mt-8"
        >
          <IllustrationEmptystateModels />
          <span class="text-body-xs text-foreground-2">No models loaded, yet.</span>
          <FormButton @click="showAddModel = true">Add model</FormButton>
        </div>
      </div>
    </ViewerLayoutSidePanel>

    <ViewerModelsAddDialog v-model:open="showAddModel" />
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
import type { ViewerLoadedResourcesQuery } from '~~/lib/common/generated/gql/graphql'
import type { Get } from 'type-fest'

import { useDiffUtilities, useSelectionUtilities } from '~~/lib/viewer/composables/ui'
import {
  useTreeManagement,
  type UnifiedVirtualItem
} from '~~/lib/viewer/composables/tree'
import { useVirtualList, useDebounceFn } from '@vueuse/core'

type ModelItem = NonNullable<Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>>

defineEmits(['close'])

const showVersions = ref(false)
const showAddModel = ref(false)
const expandedModelId = ref<string | null>(null)
const expandLevel = ref(2)
const manualExpandLevel = ref(-1)
const expandedNodes = ref<Set<string>>(new Set())
const expandedModels = ref<Set<string>>(new Set())
const disableScrollOnNextSelection = ref(false)
const refhack = ref(1)

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
const {
  objects: selectedObjects,
  addToSelection,
  clearSelection,
  removeFromSelection
} = useSelectionUtilities()
const mp = useMixpanel()
const { diffModelVersions } = useDiffUtilities()
const {
  flattenModelTree,
  getRootNodesForModel,
  findObjectInNodes,
  expandNodesToShowObject,
  getObjectDepth
} = useTreeManagement()

const hasObjects = computed(() => objects.value.length > 0)

const unifiedVirtualItems = computed(() => {
  const result: UnifiedVirtualItem[] = []

  for (const { model, versionId } of modelsAndVersionIds.value) {
    result.push({
      type: 'model-header',
      id: `model-${model.id}`,
      modelId: model.id,
      data: { model, versionId },
      isFirstModel: result.length === 0
    })

    if (expandedModels.value.has(model.id)) {
      const modelRootNodes = getRootNodesForModel(
        model.id,
        worldTree.value || null,
        stateResourceItems.value as { objectId: string; modelId?: string }[],
        modelsAndVersionIds.value
      )

      // Skip the root nodes (which duplicate model card info) and flatten their children directly
      const childNodes: ExplorerNode[] = []
      for (const rootNode of modelRootNodes) {
        if (rootNode.children && rootNode.children.length > 0) {
          childNodes.push(...rootNode.children)
        }
      }

      const treeItems = flattenModelTree(
        childNodes,
        model.id,
        expandedNodes.value,
        selectedObjects.value
      )

      if (treeItems.length > 0) {
        treeItems[0].isFirstChildOfModel = true
        treeItems[treeItems.length - 1].isLastChildOfModel = true
      }

      result.push(...treeItems)
    }
  }

  return result
})

const {
  list: virtualList,
  containerProps,
  wrapperProps
} = useVirtualList(unifiedVirtualItems, {
  itemHeight: (index) => {
    const item = unifiedVirtualItems.value[index]
    return item?.type === 'model-header' ? 80 : 40
  },
  overscan: 10
})

const handleShowVersions = (modelId: string) => {
  expandedModelId.value = modelId
  showVersions.value = true
}

const handleShowDiff = async (modelId: string, versionA: string, versionB: string) => {
  await diffModelVersions(modelId, versionA, versionB)
  expandedModelId.value = modelId
  showVersions.value = true
}

const handleVersionsClose = () => {
  showVersions.value = false
  expandedModelId.value = null
}

const removeModel = async (modelId: string) => {
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

const toggleModelExpansion = (modelId: string) => {
  if (expandedModels.value.has(modelId)) {
    expandedModels.value.delete(modelId)
  } else {
    expandedModels.value.add(modelId)
  }
}

const toggleTreeItemExpansion = (itemId: string) => {
  if (expandedNodes.value.has(itemId)) {
    expandedNodes.value.delete(itemId)
  } else {
    expandedNodes.value.add(itemId)
  }
}

const handleItemClick = (
  item: UnifiedVirtualItem,
  event: MouseEvent | KeyboardEvent
) => {
  if (item.type !== 'tree-item') return

  const node = item.data as ExplorerNode
  const speckleData = node.raw
  if (!speckleData?.id) return

  disableScrollOnNextSelection.value = true

  const isCurrentlySelected = selectedObjects.value.find((o) => o.id === speckleData.id)

  if (isCurrentlySelected && !event.shiftKey) {
    if (item.hasChildren && !item.isExpanded) {
      toggleTreeItemExpansion(item.id)
    }
    disableScrollOnNextSelection.value = false
    return
  }

  if (isCurrentlySelected && event.shiftKey) {
    removeFromSelection(speckleData)
    disableScrollOnNextSelection.value = false
    return
  }

  if (!event.shiftKey) clearSelection()
  addToSelection(speckleData)

  if (item.hasChildren && !item.isExpanded) {
    toggleTreeItemExpansion(item.id)
  }

  nextTick(() => {
    disableScrollOnNextSelection.value = false
  })
}

const getModelFromItem = (item: UnifiedVirtualItem): ModelItem => {
  if (item.type === 'model-header') {
    return (item.data as { model: ModelItem; versionId: string }).model
  }
  return {} as ModelItem
}

const getVersionIdFromItem = (item: UnifiedVirtualItem): string => {
  if (item.type === 'model-header') {
    return (item.data as { model: ModelItem; versionId: string }).versionId
  }
  return ''
}

useViewerEventListener(ViewerEvent.LoadComplete, () => {
  void refhack.value++
})

// Scroll to selected item in virtual list (centered)
const scrollToSelectedItem = (objectId: string) => {
  nextTick(() => {
    const itemIndex = unifiedVirtualItems.value.findIndex(
      (item) =>
        item.type === 'tree-item' && (item.data as ExplorerNode).raw?.id === objectId
    )
    if (itemIndex !== -1) {
      const container = containerProps.ref.value
      if (container) {
        const containerHeight = container.clientHeight
        const itemHeight = 40
        const totalOffset = itemIndex * itemHeight
        const centerOffset = containerHeight / 2 - itemHeight / 2
        const scrollPosition = Math.max(0, totalOffset - centerOffset)

        container.scrollTo({
          top: scrollPosition
        })
      }
    }
  })
}

const handleSelectionChange = useDebounceFn(
  (newSelection: typeof selectedObjects.value, shouldScroll: boolean) => {
    if (newSelection.length > 0) {
      for (const selectedObj of newSelection) {
        for (const { model } of modelsAndVersionIds.value) {
          const modelRootNodes = getRootNodesForModel(
            model.id,
            worldTree.value || null,
            stateResourceItems.value as { objectId: string; modelId?: string }[],
            modelsAndVersionIds.value
          )
          const containsObject = findObjectInNodes(modelRootNodes, selectedObj.id)

          if (containsObject) {
            expandedModels.value.add(model.id)
            expandNodesToShowObject(
              modelRootNodes,
              selectedObj.id,
              model.id,
              expandedNodes.value
            )

            const objectDepth = getObjectDepth(modelRootNodes, selectedObj.id)
            if (objectDepth > manualExpandLevel.value) {
              manualExpandLevel.value = objectDepth
            }

            if (shouldScroll) {
              scrollToSelectedItem(selectedObj.id)
            }
          }
        }
      }
    }
  },
  100
)

watch(
  selectedObjects,
  (newSelection) => {
    const shouldScroll = !disableScrollOnNextSelection.value
    handleSelectionChange(newSelection, shouldScroll)
  },
  { deep: true }
)
</script>
