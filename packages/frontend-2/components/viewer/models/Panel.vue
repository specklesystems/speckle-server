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
          <!-- Breadcrumb Headers (outside scroll area) -->
          <div v-if="activeStickyStackRef?.length" class="relative z-20 shrink-0">
            <template v-for="stickyIndex in activeStickyStackRef" :key="stickyIndex">
              <!-- Model Header Breadcrumb -->
              <template
                v-if="unifiedVirtualItems[stickyIndex]?.type === 'model-header'"
              >
                <ViewerModelsCard
                  :model="getModelFromItem(unifiedVirtualItems[stickyIndex])"
                  :version-id="getVersionIdFromItem(unifiedVirtualItems[stickyIndex])"
                  :is-expanded="
                    expandedModels.has(unifiedVirtualItems[stickyIndex].modelId)
                  "
                  @toggle-expansion="
                    toggleModelExpansion(unifiedVirtualItems[stickyIndex].modelId)
                  "
                  @remove="(id: string) => removeModel(id)"
                  @show-versions="handleShowVersions"
                  @show-diff="handleShowDiff"
                />
              </template>

              <!-- Tree Item Breadcrumb -->
              <template
                v-else-if="unifiedVirtualItems[stickyIndex]?.type === 'tree-item'"
              >
                <ViewerModelsVirtualTreeItem
                  :item="unifiedVirtualItems[stickyIndex]"
                  @toggle-expansion="toggleTreeItemExpansion"
                  @item-click="handleItemClick"
                />
              </template>
            </template>
          </div>

          <div
            ref="containerRef"
            class="flex-1 simple-scrollbar overflow-y-auto overflow-x-hidden"
          >
            <div
              :style="{
                height: `${totalSize}px`,
                width: '100%',
                position: 'relative'
              }"
            >
              <div
                v-for="virtualItem in virtualList"
                :key="virtualItem.index"
                :style="{
                  position: 'absolute',
                  transform: `translateY(${virtualItem.start}px)`,
                  height: `${virtualItem.size}px`,
                  top: 0,
                  zIndex: 1
                }"
                class="group left-0 w-full"
              >
                <template v-if="unifiedVirtualItems[virtualItem.index]">
                  <!-- Model Header -->
                  <template
                    v-if="
                      unifiedVirtualItems[virtualItem.index].type === 'model-header'
                    "
                  >
                    <div
                      :class="{
                        'border-t border-outline-3':
                          unifiedVirtualItems[virtualItem.index].needsTopBorder
                      }"
                    >
                      <ViewerModelsCard
                        :model="
                          getModelFromItem(unifiedVirtualItems[virtualItem.index])
                        "
                        :version-id="
                          getVersionIdFromItem(unifiedVirtualItems[virtualItem.index])
                        "
                        :is-expanded="
                          expandedModels.has(
                            unifiedVirtualItems[virtualItem.index].modelId
                          )
                        "
                        @toggle-expansion="
                          toggleModelExpansion(
                            unifiedVirtualItems[virtualItem.index].modelId
                          )
                        "
                        @remove="(id: string) => removeModel(id)"
                        @show-versions="handleShowVersions"
                        @show-diff="handleShowDiff"
                      />
                    </div>
                  </template>

                  <!-- Tree Item -->
                  <template
                    v-else-if="
                      unifiedVirtualItems[virtualItem.index].type === 'tree-item'
                    "
                  >
                    <div
                      v-if="unifiedVirtualItems[virtualItem.index].isFirstChildOfModel"
                      class="h-1 w-full"
                    />
                    <ViewerModelsVirtualTreeItem
                      :item="unifiedVirtualItems[virtualItem.index]"
                      @toggle-expansion="toggleTreeItemExpansion"
                      @item-click="handleItemClick"
                    />
                    <div
                      v-if="unifiedVirtualItems[virtualItem.index].isLastChildOfModel"
                      class="h-1 w-full"
                    />
                  </template>
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

import type { ExplorerNode } from '~~/lib/viewer/helpers/sceneExplorer'
import type { ViewerLoadedResourcesQuery } from '~~/lib/common/generated/gql/graphql'
import type { Get } from 'type-fest'

import { useDiffUtilities, useSelectionUtilities } from '~~/lib/viewer/composables/ui'
import {
  useTreeManagement,
  useVirtualTreeList,
  type UnifiedVirtualItem
} from '~~/lib/viewer/composables/tree'
import { useDebounceFn, useScroll } from '@vueuse/core'

type ModelItem = NonNullable<Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>>

defineEmits(['close'])

const showVersions = ref(false)
const showAddModel = ref(false)
const expandedModelId = ref<string | null>(null)
const manualExpandLevel = ref(-1)
const expandedNodes = ref<Set<string>>(new Set())
const expandedModels = ref<Set<string>>(new Set())
const disableScrollOnNextSelection = ref(false)
const containerRef = ref<HTMLElement>()

// Use scroll detection to know when we're at the bottom
const { arrivedState } = useScroll(containerRef)

// Use the new virtual tree list composable
const { activeStickyStackRef, createVirtualizer, scrollToSelectedItem } =
  useVirtualTreeList()

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

  modelsAndVersionIds.value.forEach(({ model, versionId }, modelIndex) => {
    const previousModelWasExpanded =
      modelIndex > 0 &&
      result.some(
        (item) =>
          item.type === 'tree-item' &&
          item.modelId === modelsAndVersionIds.value[modelIndex - 1]?.model.id
      )

    const modelHeader: UnifiedVirtualItem = {
      type: 'model-header',
      id: `model-${model.id}`,
      modelId: model.id,
      data: { model, versionId },
      isFirstModel: modelIndex === 0,
      needsTopBorder: previousModelWasExpanded
    }

    result.push(modelHeader)

    if (expandedModels.value.has(model.id)) {
      const modelRootNodes = getRootNodesForModel(
        model.id,
        worldTree.value || null,
        stateResourceItems.value as { objectId: string; modelId?: string }[],
        modelsAndVersionIds.value
      )

      const childNodes = modelRootNodes.flatMap((rootNode) => rootNode.children || [])
      const treeItems = flattenModelTree(
        childNodes,
        model.id,
        expandedNodes.value,
        selectedObjects.value
      )

      // Mark first and last children
      treeItems.forEach((item, index) => {
        if (index === 0) item.isFirstChildOfModel = true
        if (index === treeItems.length - 1) item.isLastChildOfModel = true
      })

      result.push(...treeItems)
    }
  })

  return result
})

const virtualizer = createVirtualizer(unifiedVirtualItems, containerRef, arrivedState)

const virtualList = computed(() => virtualizer.value.getVirtualItems())
const totalSize = computed(() => virtualizer.value.getTotalSize())

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
              scrollToSelectedItem(virtualizer, unifiedVirtualItems, selectedObj.id)
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
