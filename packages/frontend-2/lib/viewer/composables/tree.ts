import type { ExplorerNode } from '~~/lib/viewer/helpers/sceneExplorer'
import type { ViewerLoadedResourcesQuery } from '~~/lib/common/generated/gql/graphql'
import type { Get } from 'type-fest'
import type { WorldTree } from '@speckle/viewer'
import { sortBy, flatten, isArray, isString } from 'lodash-es'
import { isObjectLike } from '~/lib/common/helpers/type'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { useThrottle } from '@vueuse/core'

type ModelItem = NonNullable<Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>>
type ModelWithVersion = { model: ModelItem; versionId: string }

const HIDDEN_SPECKLE_TYPES = [
  'Objects.Other',
  'ColorProxy',
  'InstanceDefinitionProxy',
  'GroupProxy',
  'RenderMaterialProxy',
  'Objects.BuiltElements.Revit.ProjectInfo',
  'Objects.BuiltElements.View',
  'Objects.BuiltElements.View3D'
] as const

const EXCLUDED_COLLECTION_KEYS = ['children', 'elements'] as const
const DISPLAY_VALUE_KEY = 'displayValue'
const MAX_EXPANSION_DEPTH = 20

const isReferencedIdArray = (value: unknown): value is { referencedId: string }[] => {
  return (
    isArray(value) &&
    value.length > 0 &&
    isObjectLike(value[0]) &&
    'referencedId' in value[0] &&
    isString(value[0].referencedId)
  )
}

export type UnifiedVirtualItem = {
  type: 'model-header' | 'tree-item'
  id: string
  modelId: string
  data: ExplorerNode | ModelWithVersion
  indent?: number
  hasChildren?: boolean
  isExpanded?: boolean
  isDescendantOfSelected?: boolean
  isFirstChildOfModel?: boolean
  isLastChildOfModel?: boolean
  isFirstModel?: boolean
  needsTopBorder?: boolean
}

export function useTreeManagement() {
  const isAllowedType = (node: ExplorerNode) => {
    const speckleType = node.raw?.speckle_type || ''
    return !HIDDEN_SPECKLE_TYPES.some((substring) => speckleType.includes(substring))
  }

  const flattenModelTree = (
    nodes: ExplorerNode[],
    modelId: string,
    expandedNodes: Set<string>,
    selectedObjects: { id: string }[],
    indent = 0,
    isDescendantOfSelected = false
  ): UnifiedVirtualItem[] => {
    const result: UnifiedVirtualItem[] = []

    for (const node of nodes) {
      const nodeId = node.raw?.id || node.guid || ''
      if (!nodeId) continue

      const speckleData = node.raw
      const isNodeSelected = selectedObjects.find((o) => o.id === nodeId)
      const shouldMarkDescendantsAsSelected = isDescendantOfSelected || !!isNodeSelected

      const isNonEmptyArray = (x: unknown): x is Array<unknown> =>
        !!x && Array.isArray(x) && x.length > 0
      const isNonEmptyObjectArray = (x: unknown) =>
        isNonEmptyArray(x) &&
        typeof x[0] === 'object' &&
        !Array.isArray(x[0]) &&
        x[0] !== null

      const isSingleCollection =
        isNonEmptyObjectArray(speckleData?.children) ||
        isNonEmptyObjectArray(speckleData?.elements)

      const arrayCollections = []
      for (const k of Object.keys(speckleData || {})) {
        if (
          EXCLUDED_COLLECTION_KEYS.includes(
            k as (typeof EXCLUDED_COLLECTION_KEYS)[number]
          ) ||
          k.includes(DISPLAY_VALUE_KEY)
        )
          continue

        const val = speckleData?.[k]
        if (!isReferencedIdArray(val)) continue

        const ids = val.map((ref) => ref.referencedId)
        const actualRawRefs =
          node.children?.filter(
            (childNode) =>
              ids.includes(childNode.raw?.id as string) && isAllowedType(childNode)
          ) || []

        if (actualRawRefs.length === 0) continue

        const modelCollectionItem: ExplorerNode = {
          raw: {
            name: k,
            id: k,
            speckle_type: 'Array Collection', // eslint-disable-line camelcase
            children: val
          },
          children: actualRawRefs
        }

        arrayCollections.push(modelCollectionItem)
      }

      const isMultipleCollection = arrayCollections.length > 0
      const hasChildren = isSingleCollection || isMultipleCollection
      const isExpanded = hasChildren && expandedNodes.has(nodeId)

      result.push({
        type: 'tree-item',
        id: nodeId,
        modelId,
        data: node,
        indent,
        hasChildren,
        isExpanded,
        isDescendantOfSelected
      })

      if (isExpanded) {
        if (isMultipleCollection) {
          const arrayChildren = flattenModelTree(
            arrayCollections,
            modelId,
            expandedNodes,
            selectedObjects,
            indent + 1,
            shouldMarkDescendantsAsSelected
          )
          result.push(...arrayChildren)
        }

        if (isSingleCollection) {
          const treeItems =
            node.children?.filter((child) => !!child.raw?.id && isAllowedType(child)) ||
            []

          if (
            isReferencedIdArray(speckleData?.elements) &&
            speckleData?.atomic === true
          ) {
            const elementIds = speckleData.elements.map((obj) => obj.referencedId)
            const filteredItems = treeItems.filter((item) =>
              elementIds.includes(item.raw?.id as string)
            )
            const children = flattenModelTree(
              filteredItems,
              modelId,
              expandedNodes,
              selectedObjects,
              indent + 1,
              shouldMarkDescendantsAsSelected
            )
            result.push(...children)
          } else {
            const children = flattenModelTree(
              treeItems,
              modelId,
              expandedNodes,
              selectedObjects,
              indent + 1,
              shouldMarkDescendantsAsSelected
            )
            result.push(...children)
          }
        }
      }
    }

    return result
  }

  const getRootNodesForModel = (
    modelId: string,
    worldTree: WorldTree | null,
    stateResourceItems: { objectId: string; modelId?: string }[],
    modelsAndVersionIds: { model: ModelItem; versionId: string }[]
  ) => {
    if (!worldTree) return []

    const rootNodes = worldTree._root.children as ExplorerNode[]
    const results: Record<number, ExplorerNode[]> = {}
    const unmatchedNodes: ExplorerNode[] = []

    for (const node of rootNodes) {
      const objectId = ((node.model as Record<string, unknown>).id as string)
        .split('/')
        .reverse()[0] as string
      const resourceItemIdx = stateResourceItems.findIndex(
        (res) => res.objectId === objectId
      )
      const resourceItem =
        resourceItemIdx !== -1 ? stateResourceItems[resourceItemIdx] : null

      const raw = node.model?.raw as Record<string, unknown>
      if (resourceItem?.modelId) {
        const model = modelsAndVersionIds.find(
          (item) => item.model.id === resourceItem.modelId
        )?.model
        raw.name = model?.name
        raw.type = model?.id

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

  const findObjectInNodes = (nodes: ExplorerNode[], objectId: string): boolean => {
    if (!nodes || nodes.length === 0) return false

    for (const node of nodes) {
      if (node.raw?.id === objectId) {
        return true
      }

      if (node.children && node.children.length > 0) {
        if (findObjectInNodes(node.children, objectId)) {
          return true
        }
      }
    }

    return false
  }

  const expandNodesToShowObject = (
    nodes: ExplorerNode[],
    objectId: string,
    modelId: string,
    expandedNodes: Set<string>,
    depth = 0
  ): boolean => {
    if (!nodes || nodes.length === 0 || depth > MAX_EXPANSION_DEPTH) return false

    for (const node of nodes) {
      if (node.raw?.id === objectId) {
        return true
      }

      if (node.children && node.children.length > 0) {
        if (
          expandNodesToShowObject(
            node.children,
            objectId,
            modelId,
            expandedNodes,
            depth + 1
          )
        ) {
          if (node.raw?.id) {
            expandedNodes.add(node.raw.id)
          }

          // Also check if we need to expand array collection
          const speckleData = node.raw
          if (speckleData) {
            for (const k of Object.keys(speckleData)) {
              if (
                EXCLUDED_COLLECTION_KEYS.includes(
                  k as (typeof EXCLUDED_COLLECTION_KEYS)[number]
                ) ||
                k.includes(DISPLAY_VALUE_KEY)
              )
                continue

              const val = speckleData[k]
              if (isReferencedIdArray(val)) {
                const ids = val.map((ref) => ref.referencedId)
                const hasMatchingChild = node.children?.some((child) =>
                  ids.includes(child.raw?.id as string)
                )
                if (hasMatchingChild) {
                  expandedNodes.add(k)
                }
              }
            }
          }

          return true
        }
      }
    }
    return false
  }

  const getObjectDepth = (
    nodes: ExplorerNode[],
    objectId: string,
    currentDepth = 0
  ): number => {
    for (const node of nodes) {
      if (node.raw?.id === objectId) {
        return currentDepth
      }

      if (node.children) {
        const childDepth = getObjectDepth(node.children, objectId, currentDepth + 1)
        if (childDepth !== -1) {
          return childDepth
        }
      }
    }
    return -1
  }

  return {
    isAllowedType,
    flattenModelTree,
    getRootNodesForModel,
    findObjectInNodes,
    expandNodesToShowObject,
    getObjectDepth
  }
}

export function useVirtualTreeList() {
  const rawStickyStackRef = ref<number[]>([])
  const activeStickyStackRef = useThrottle(rawStickyStackRef, 16) // ~60fps for smooth updates
  const lastStartIndex = ref(-1)
  const lastStickyStack = ref<number[]>([])
  const areTreeItemStickiesEnabled = ref(false)

  const findActiveStickyStack = (
    startIndex: number,
    unifiedVirtualItems: UnifiedVirtualItem[]
  ): number[] => {
    // Early return if we've already calculated for this startIndex
    if (startIndex === lastStartIndex.value) {
      return lastStickyStack.value
    }

    // If we're near the end, use the last calculated result to prevent flashing
    const totalItems = unifiedVirtualItems.length
    if (startIndex >= totalItems - 2 && lastStickyStack.value.length > 0) {
      return lastStickyStack.value
    }

    const stack: number[] = []

    // Find sticky indexes (model headers)
    const stickyIndexes = unifiedVirtualItems
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item?.type === 'model-header')
      .map(({ index }) => index)

    const activeModelIndex = [...stickyIndexes]
      .reverse()
      .find((index) => startIndex > index)

    if (activeModelIndex !== undefined) {
      stack.push(activeModelIndex)
    }

    let currentActiveModelIndex = activeModelIndex

    // If we're past the first model, find which model we're actually viewing
    if (startIndex > (activeModelIndex || 0)) {
      // Look for the last model header that comes before the visible area
      for (let i = startIndex - 1; i >= 0; i--) {
        const item = unifiedVirtualItems[i]
        if (item?.type === 'model-header') {
          currentActiveModelIndex = i
          break
        }
      }
    }

    const currentModelId =
      currentActiveModelIndex !== undefined
        ? unifiedVirtualItems[currentActiveModelIndex]?.modelId
        : null

    if (
      areTreeItemStickiesEnabled.value &&
      currentModelId &&
      currentActiveModelIndex !== undefined
    ) {
      // Only look at tree items between this model and the visible area
      const modelStartIndex = currentActiveModelIndex
      const activeTreeStickies: number[] = []

      // Find tree items that belong to current model and have scrolled past visible area
      for (let i = modelStartIndex + 1; i < startIndex; i++) {
        const item = unifiedVirtualItems[i]

        if (
          item?.type === 'tree-item' &&
          item?.modelId === currentModelId &&
          item?.hasChildren &&
          item?.isExpanded
        ) {
          const depth = item?.indent || 0

          // Only keep one sticky item per depth level (the latest one)
          const existingAtDepth = activeTreeStickies.find((stickyIndex) => {
            const stickyItem = unifiedVirtualItems[stickyIndex]
            return (stickyItem?.indent || 0) === depth
          })

          if (existingAtDepth) {
            // Replace with later item at same depth
            const existingIndex = activeTreeStickies.indexOf(existingAtDepth)
            activeTreeStickies[existingIndex] = i
          } else {
            activeTreeStickies.push(i)
          }
        }
      }

      // Check only the topmost visible item to see if it should clear sticky items
      const topmostVisibleItem = unifiedVirtualItems[startIndex]

      if (
        topmostVisibleItem?.type === 'tree-item' &&
        topmostVisibleItem?.modelId === currentModelId
      ) {
        const visibleDepth = topmostVisibleItem?.indent || 0

        for (let j = activeTreeStickies.length - 1; j >= 0; j--) {
          const stickyIndex = activeTreeStickies[j]
          const stickyItem = unifiedVirtualItems[stickyIndex]
          const stickyDepth = stickyItem?.indent || 0

          if (stickyDepth >= visibleDepth) {
            activeTreeStickies.splice(j, 1)
          }
        }
      }

      activeTreeStickies
        .sort((a, b) => {
          const depthA = unifiedVirtualItems[a]?.indent || 0
          const depthB = unifiedVirtualItems[b]?.indent || 0
          return depthA - depthB
        })
        .forEach((index) => stack.push(index))
    }

    lastStartIndex.value = startIndex
    lastStickyStack.value = stack

    return stack
  }

  const createVirtualizer = (
    unifiedVirtualItems: Ref<UnifiedVirtualItem[]>,
    containerRef: Ref<HTMLElement | undefined>,
    arrivedState: { bottom: boolean }
  ) => {
    return useVirtualizer({
      get count() {
        return unifiedVirtualItems.value.length
      },
      getScrollElement: () => containerRef.value || null,
      estimateSize: (index: number) => {
        const item = unifiedVirtualItems.value[index]
        if (item?.type === 'model-header') {
          return 73
        }

        // Tree items: base height + spacer heights
        let height = 40
        if (item?.isFirstChildOfModel) height += 4
        if (item?.isLastChildOfModel) height += 4

        return height
      },
      overscan: 10,
      rangeExtractor: (range) => {
        if (!arrivedState.bottom) {
          rawStickyStackRef.value =
            findActiveStickyStack(range.startIndex, unifiedVirtualItems.value) || []
        }

        return Array.from(
          { length: range.endIndex - range.startIndex + 1 },
          (_, i) => range.startIndex + i
        )
      }
    })
  }

  const scrollToSelectedItem = (
    virtualizer: Ref<{
      getTotalSize: () => number
      scrollToIndex: (
        index: number,
        options?: { align?: 'start' | 'center' | 'end' | 'auto' }
      ) => void
      getVirtualItems: () => Array<{ index: number }>
    }>,
    unifiedVirtualItems: Ref<UnifiedVirtualItem[]>,
    objectId: string
  ) => {
    // Wait for the next tick to ensure virtual list has updated after expansions
    nextTick(() => {
      const matchingIndexes = unifiedVirtualItems.value
        .map((item, index) => ({ item, index }))
        .filter(
          ({ item }) =>
            item.type === 'tree-item' &&
            (item.data as ExplorerNode).raw?.id === objectId
        )
        .map(({ index }) => index)

      if (matchingIndexes.length > 0) {
        const targetIndex = matchingIndexes[matchingIndexes.length - 1]

        if (virtualizer.value.getTotalSize() > 0) {
          virtualizer.value.scrollToIndex(targetIndex, { align: 'center' })
          nextTick(() => {
            const virtualItems = virtualizer.value.getVirtualItems()
            if (virtualItems.length > 0) {
              const startIndex = virtualItems[0]?.index || 0
              rawStickyStackRef.value =
                findActiveStickyStack(startIndex, unifiedVirtualItems.value) || []
            }
          })
        }
      }
    })
  }

  return {
    rawStickyStackRef,
    activeStickyStackRef,
    findActiveStickyStack,
    createVirtualizer,
    scrollToSelectedItem
  }
}
