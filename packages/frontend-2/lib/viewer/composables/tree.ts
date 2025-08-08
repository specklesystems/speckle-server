import type { ExplorerNode } from '~~/lib/viewer/helpers/sceneExplorer'
import type { ViewerLoadedResourcesQuery } from '~~/lib/common/generated/gql/graphql'
import type { Get } from 'type-fest'
import type { WorldTree, ViewerEventPayload } from '@speckle/viewer'
import { sortBy, flatten, isArray, isString, keyBy } from 'lodash-es'
import { isObjectLike } from '~/lib/common/helpers/type'
import { ViewerEvent } from '@speckle/viewer'
import { useEventListener } from '@vueuse/core'

type ModelItem = NonNullable<Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>>
type ModelWithVersion = { model: ModelItem; versionId: string }

const HIDDEN_SPECKLE_TYPES = new Set([
  'Objects.Other',
  'ColorProxy',
  'InstanceDefinitionProxy',
  'GroupProxy',
  'RenderMaterialProxy',
  'Objects.BuiltElements.Revit.ProjectInfo',
  'Objects.BuiltElements.View',
  'Objects.BuiltElements.View3D'
] as const)

const EXCLUDED_COLLECTION_KEYS = new Set(['children', 'elements'] as const)
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

function createTreeStateManager() {
  const flattenedTreeCache = reactive(new Map<string, UnifiedVirtualItem[]>())
  const lastCacheKey = ref('')
  const isInitialized = ref(false)

  let viewer: {
    on: <T extends ViewerEvent>(
      eventType: T,
      listener: (arg: ViewerEventPayload[T]) => void
    ) => void
    removeListener: <T extends ViewerEvent>(
      eventType: T,
      listener: (arg: ViewerEventPayload[T]) => void
    ) => void
  } | null = null

  const clearCache = () => {
    flattenedTreeCache.clear()
    lastCacheKey.value = ''
  }

  const getCacheKey = (
    modelsAndVersionIds: { model: ModelItem; versionId: string }[],
    expandedModels: Set<string>,
    expandedNodes: Set<string>,
    selectedObjects: { id: string }[]
  ): string => {
    const parts = [
      modelsAndVersionIds
        .map(({ model, versionId }) => `${model.id}:${versionId}`)
        .join('|'),
      Array.from(expandedModels).sort().join(','),
      Array.from(expandedNodes).sort().join(','),
      selectedObjects
        .map((o) => o.id)
        .sort()
        .join(',')
    ]
    return parts.join('#')
  }

  const initialize = (viewerInstance: typeof viewer) => {
    if (isInitialized.value || !viewerInstance) return

    viewer = viewerInstance
    isInitialized.value = true

    const onLoadComplete = () => clearCache()
    viewer.on(ViewerEvent.LoadComplete, onLoadComplete)

    if (import.meta.client) {
      useEventListener('beforeunload', () => {
        viewer?.removeListener(ViewerEvent.LoadComplete, onLoadComplete)
        clearCache()
      })
    }
  }

  const getUnifiedVirtualItems = (
    modelsAndVersionIds: { model: ModelItem; versionId: string }[],
    expandedModels: Set<string>,
    expandedNodes: Set<string>,
    selectedObjects: { id: string }[],
    worldTree: WorldTree | null,
    stateResourceItems: { objectId: string; modelId?: string }[],
    getRootNodesForModel: (
      modelId: string,
      worldTree: WorldTree | null,
      stateResourceItems: { objectId: string; modelId?: string }[],
      modelsAndVersionIds: { model: ModelItem; versionId: string }[]
    ) => ExplorerNode[],
    flattenModelTree: (
      nodes: ExplorerNode[],
      modelId: string,
      expandedNodes: Set<string>,
      selectedObjects: { id: string }[],
      indent?: number,
      isDescendantOfSelected?: boolean
    ) => UnifiedVirtualItem[]
  ): UnifiedVirtualItem[] => {
    const cacheKey = getCacheKey(
      modelsAndVersionIds,
      expandedModels,
      expandedNodes,
      selectedObjects
    )

    if (lastCacheKey.value === cacheKey && flattenedTreeCache.has(cacheKey)) {
      return flattenedTreeCache.get(cacheKey)!
    }

    const result: UnifiedVirtualItem[] = []

    modelsAndVersionIds.forEach(({ model, versionId }, index) => {
      result.push({
        type: 'model-header',
        id: `model-${model.id}`,
        modelId: model.id,
        data: { model, versionId },
        isFirstModel: index === 0
      })

      if (expandedModels.has(model.id)) {
        const modelRootNodes = getRootNodesForModel(
          model.id,
          worldTree,
          stateResourceItems,
          modelsAndVersionIds
        )
        const childNodes = flatten(modelRootNodes.map((node) => node.children || []))

        if (childNodes.length > 0) {
          const treeItems = flattenModelTree(
            childNodes,
            model.id,
            expandedNodes,
            selectedObjects
          )

          if (treeItems.length > 0) {
            treeItems[0].isFirstChildOfModel = true
            treeItems[treeItems.length - 1].isLastChildOfModel = true
            result.push(...treeItems)
          }
        }
      }
    })

    // Cache the result
    flattenedTreeCache.set(cacheKey, result)
    lastCacheKey.value = cacheKey

    return result
  }

  return {
    initialize,
    getUnifiedVirtualItems,
    clearCache: readonly(clearCache)
  }
}

const treeStateManager = createTreeStateManager()

export function useTreeManagement() {
  const typeCheckCache = new Map<string, boolean>()

  const isAllowedType = (node: ExplorerNode): boolean => {
    const speckleType = node.raw?.speckle_type || ''
    if (!speckleType) return true

    if (typeCheckCache.has(speckleType)) {
      return typeCheckCache.get(speckleType)!
    }

    const isAllowed = !Array.from(HIDDEN_SPECKLE_TYPES).some((substring) =>
      speckleType.includes(substring)
    )

    if (typeCheckCache.size < 1000) {
      typeCheckCache.set(speckleType, isAllowed)
    }

    return isAllowed
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
    const selectedObjectIds = new Set(selectedObjects.map((obj) => obj.id))

    for (const node of nodes) {
      const nodeId = node.raw?.id || node.guid || ''
      if (!nodeId) continue

      const speckleData = node.raw
      const isNodeSelected = selectedObjectIds.has(nodeId)
      const shouldMarkDescendantsAsSelected = isDescendantOfSelected || isNodeSelected

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
      const arrayCollections: ExplorerNode[] = []

      if (speckleData) {
        Object.entries(speckleData).forEach(([k, val]) => {
          if (
            EXCLUDED_COLLECTION_KEYS.has(k as 'children' | 'elements') ||
            k.includes(DISPLAY_VALUE_KEY)
          )
            return
          if (!isReferencedIdArray(val)) return

          const ids = new Set(val.map((ref) => ref.referencedId))
          const actualRawRefs =
            node.children?.filter((childNode) => {
              const childId = childNode.raw?.id as string
              return ids.has(childId) && isAllowedType(childNode)
            }) || []

          if (actualRawRefs.length > 0) {
            arrayCollections.push({
              raw: {
                name: k,
                id: k,
                speckle_type: 'Array Collection', // eslint-disable-line camelcase
                children: val
              },
              children: actualRawRefs
            })
          }
        })
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
          result.push(
            ...flattenModelTree(
              arrayCollections,
              modelId,
              expandedNodes,
              selectedObjects,
              indent + 1,
              shouldMarkDescendantsAsSelected
            )
          )
        }

        if (isSingleCollection) {
          const treeItems =
            node.children?.filter((child) => !!child.raw?.id && isAllowedType(child)) ||
            []

          let filteredItems = treeItems
          if (
            isReferencedIdArray(speckleData?.elements) &&
            speckleData?.atomic === true
          ) {
            const elementIds = new Set(
              speckleData.elements.map((obj) => obj.referencedId)
            )
            filteredItems = treeItems.filter((item) =>
              elementIds.has(item.raw?.id as string)
            )
          }

          result.push(
            ...flattenModelTree(
              filteredItems,
              modelId,
              expandedNodes,
              selectedObjects,
              indent + 1,
              shouldMarkDescendantsAsSelected
            )
          )
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
  ): ExplorerNode[] => {
    if (!worldTree) return []

    const resourceItemsMap = keyBy(
      stateResourceItems.map((item, index) => ({ ...item, index })),
      'objectId'
    )
    const modelsMap = keyBy(
      modelsAndVersionIds.map(({ model }) => model),
      'id'
    )

    const rootNodes = worldTree._root.children as ExplorerNode[]
    const results: Record<number, ExplorerNode[]> = {}
    const unmatchedNodes: ExplorerNode[] = []

    rootNodes.forEach((node) => {
      const objectId = ((node.model as Record<string, unknown>).id as string)
        .split('/')
        .reverse()[0] as string

      const resourceData = resourceItemsMap[objectId]
      const resourceItem = resourceData
      const resourceItemIdx = resourceData?.index ?? -1

      const raw = node.model?.raw as Record<string, unknown>

      if (resourceItem?.modelId) {
        const model = modelsMap[resourceItem.modelId]
        raw.name = model?.name
        raw.type = model?.id

        if (resourceItem.modelId === modelId) {
          const res = node.model as ExplorerNode
          if (resourceItemIdx !== -1) {
            ;(results[resourceItemIdx] = results[resourceItemIdx] || []).push(res)
          } else {
            unmatchedNodes.push(res)
          }
        }
      } else {
        Object.assign(raw, { name: 'Object', type: 'Single object' })

        if (resourceItem && resourceItem.objectId === modelId) {
          unmatchedNodes.push(node.model as ExplorerNode)
        }
      }
    })

    return [
      ...flatten(
        sortBy(Object.entries(results), ([index]) => Number(index)).map(
          ([, nodes]) => nodes
        )
      ),
      ...unmatchedNodes
    ]
  }

  const findObjectInNodes = (nodes: ExplorerNode[], objectId: string): boolean => {
    return nodes.some(
      (node) =>
        node.raw?.id === objectId ||
        (node.children?.length && findObjectInNodes(node.children, objectId))
    )
  }

  const expandNodesToShowObject = (
    nodes: ExplorerNode[],
    objectId: string,
    modelId: string,
    expandedNodes: Set<string>,
    depth = 0
  ): boolean => {
    if (!nodes?.length || depth > MAX_EXPANSION_DEPTH) return false

    return nodes.some((node) => {
      if (node.raw?.id === objectId) return true

      if (node.children?.length) {
        const found = expandNodesToShowObject(
          node.children,
          objectId,
          modelId,
          expandedNodes,
          depth + 1
        )
        if (found) {
          if (node.raw?.id) expandedNodes.add(node.raw.id)

          // Handle array collections
          const speckleData = node.raw
          if (speckleData) {
            Object.entries(speckleData).forEach(([k, val]) => {
              if (
                EXCLUDED_COLLECTION_KEYS.has(k as 'children' | 'elements') ||
                k.includes(DISPLAY_VALUE_KEY)
              )
                return

              if (isReferencedIdArray(val)) {
                const ids = new Set(val.map((ref) => ref.referencedId))
                if (node.children?.some((child) => ids.has(child.raw?.id as string))) {
                  expandedNodes.add(k)
                }
              }
            })
          }
          return true
        }
      }
      return false
    })
  }

  return {
    flattenModelTree,
    getRootNodesForModel,
    findObjectInNodes,
    expandNodesToShowObject,
    treeStateManager
  }
}
