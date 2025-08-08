<template>
  <div class="select-none h-full">
    <ViewerModelsVersions
      v-if="showVersions"
      :expanded-model-id="expandedModelId"
      @close="handleVersionsClose"
    />
    <ViewerLayoutSidePanel v-else>
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
          <!-- Sticky Header Area (outside virtual list) -->
          <div v-if="stickyHeader" class="sticky top-0 z-20 h-16">
            <ViewerModelsCard
              :model="stickyHeader!.model"
              :version-id="stickyHeader!.versionId"
              :last="false"
              :first="false"
              :expand-level="expandLevel"
              :manual-expand-level="manualExpandLevel"
              :root-nodes="[]"
              :is-expanded="expandedModels.has(stickyHeader!.model.id)"
              @toggle-expansion="toggleModelExpansion(stickyHeader!.model.id)"
              @expanded="(e: number) => (manualExpandLevel < e ? (manualExpandLevel = e) : '')"
              @show-versions="handleShowVersions"
              @show-diff="handleShowDiff"
            />
          </div>

          <div
            class="flex-1 simple-scrollbar overflow-x-hidden"
            data-virtual-list-container
            v-bind="containerProps"
            @scroll="handleScroll"
          >
            <div v-bind="wrapperProps">
              <div
                v-for="{ data: item } in virtualList"
                :key="item.id"
                :data-item-id="item.id"
                class="group first:hidden"
              >
                <!-- Model Header -->
                <template v-if="item.type === 'model-header'">
                  <div class="bg-foundation h-16">
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
  useInjectedViewer,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
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
const stickyHeader = ref<{ model: ModelItem; versionId: string } | null>(null)
const scrollTop = ref(0)

const { resourceItems, modelsAndVersionIds, objects } =
  useInjectedViewerLoadedResources()
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
const { diffModelVersions } = useDiffUtilities()
const {
  flattenModelTree,
  getRootNodesForModel,
  findObjectInNodes,
  expandNodesToShowObject,
  getObjectDepth,
  treeStateManager
} = useTreeManagement()

const hasObjects = computed(() => objects.value.length > 0)

const unifiedVirtualItems = computed(() => {
  return treeStateManager.getUnifiedVirtualItems(
    modelsAndVersionIds.value,
    expandedModels.value,
    expandedNodes.value,
    selectedObjects.value,
    worldTree.value || null,
    stateResourceItems.value as { objectId: string; modelId?: string }[],
    getRootNodesForModel,
    flattenModelTree
  )
})

const {
  list: virtualList,
  containerProps,
  wrapperProps
} = useVirtualList(unifiedVirtualItems, {
  itemHeight: (index) => {
    const item = unifiedVirtualItems.value[index]
    return item?.type === 'model-header' ? 64 : 40
  },
  overscan: 20
})

// Calculate header positions precisely - memoized for performance
const modelHeaderPositions = computed(() => {
  const headers: Array<{
    index: number
    model: ModelItem
    versionId: string
    position: number
  }> = []

  let cumulativeHeight = 0
  for (let i = 0; i < unifiedVirtualItems.value.length; i++) {
    const item = unifiedVirtualItems.value[i]
    const itemHeight = item.type === 'model-header' ? 64 : 40

    if (item.type === 'model-header') {
      const data = item.data as { model: ModelItem; versionId: string }
      headers.push({
        index: i,
        model: data.model,
        versionId: data.versionId,
        position: cumulativeHeight
      })
    }
    cumulativeHeight += itemHeight
  }
  return headers
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

  const isCurrentlySelected = selectedObjects.value.find((o) => o.id === speckleData.id)

  if (isCurrentlySelected && !event.shiftKey) {
    if (item.hasChildren && !item.isExpanded) {
      toggleTreeItemExpansion(item.id)
    }
    return
  }

  if (isCurrentlySelected && event.shiftKey) {
    disableScrollOnNextSelection.value = true
    removeFromSelection(speckleData)
    return
  }

  // Disable scroll for this user-initiated selection
  disableScrollOnNextSelection.value = true

  if (!event.shiftKey) clearSelection()
  addToSelection(speckleData)

  if (item.hasChildren && !item.isExpanded) {
    toggleTreeItemExpansion(item.id)
  }
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
  (newSelection: typeof selectedObjects.value) => {
    if (newSelection.length > 0 && !disableScrollOnNextSelection.value) {
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

            scrollToSelectedItem(selectedObj.id)
            break
          }
        }
        break
      }
    }

    disableScrollOnNextSelection.value = false
  },
  100
)

// Simple scroll tracking - just switch headers
const handleScroll = (e: Event) => {
  const container = e.target as HTMLElement
  if (!container) return

  scrollTop.value = container.scrollTop

  const modelHeaders = modelHeaderPositions.value
  if (modelHeaders.length === 0) return

  // Find the current active header
  let currentHeaderIndex = 0
  for (let i = modelHeaders.length - 1; i >= 0; i--) {
    if (modelHeaders[i].position <= scrollTop.value) {
      currentHeaderIndex = i
      break
    }
  }

  const currentHeader = modelHeaders[currentHeaderIndex]

  // Simply update sticky header
  if (currentHeader) {
    stickyHeader.value = {
      model: currentHeader.model,
      versionId: currentHeader.versionId
    }
  }
}

useViewerEventListener(ViewerEvent.LoadComplete, () => {
  void refhack.value++
})

watch(selectedObjects, handleSelectionChange, { deep: true })

// Initialize and update sticky header when models change
watch(
  unifiedVirtualItems,
  (items) => {
    if (items.length > 0) {
      const firstModelHeader = items.find((item) => item.type === 'model-header')
      if (firstModelHeader) {
        const data = firstModelHeader.data as { model: ModelItem; versionId: string }

        // Always update to the current first model (handles new models being added)
        stickyHeader.value = {
          model: data.model,
          versionId: data.versionId
        }
      }
    } else {
      stickyHeader.value = null
    }
  },
  { immediate: true }
)
</script>
