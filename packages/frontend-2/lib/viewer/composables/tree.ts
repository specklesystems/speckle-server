import type { ExplorerNode } from '~~/lib/viewer/helpers/sceneExplorer'
import type { ViewerLoadedResourcesQuery } from '~~/lib/common/generated/gql/graphql'
import type { Get } from 'type-fest'
import type { WorldTree } from '@speckle/viewer'
import { sortBy, flatten } from 'lodash-es'

type ModelItem = NonNullable<Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>>

export type UnifiedVirtualItem = {
  type: 'model-header' | 'tree-item'
  id: string
  modelId: string
  data: ExplorerNode | { model: ModelItem; versionId: string }
  indent?: number
  hasChildren?: boolean
  isExpanded?: boolean
  isDescendantOfSelected?: boolean
  isFirstChildOfModel?: boolean
  isLastChildOfModel?: boolean
  isFirstModel?: boolean
}

export function useTreeManagement() {
  const isAllowedType = (node: ExplorerNode) => {
    const hiddenSpeckleTypes = [
      'Objects.Other',
      'ColorProxy',
      'InstanceDefinitionProxy',
      'GroupProxy',
      'RenderMaterialProxy',
      'Objects.BuiltElements.Revit.ProjectInfo',
      'Objects.BuiltElements.View',
      'Objects.BuiltElements.View3D'
    ]

    const speckleType = node.raw?.speckle_type || ''
    return !hiddenSpeckleTypes.some((substring) => speckleType.includes(substring))
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
        if (k === 'children' || k === 'elements' || k.includes('displayValue')) continue

        const val = speckleData?.[k] as { referencedId: string }[]
        if (!isNonEmptyObjectArray(val)) continue

        const ids = val.map((ref) => ref.referencedId)
        const actualRawRefs =
          node.children?.filter(
            (childNode) =>
              ids.includes(childNode.raw?.id as string) && isAllowedType(childNode)
          ) || []

        if (actualRawRefs.length === 0) continue

        const modelCollectionItem = {
          raw: {
            name: k,
            id: k,
            speckle_type: 'Array Collection', // eslint-disable-line camelcase
            children: val
          },
          children: actualRawRefs,
          expanded: false
        } as ExplorerNode

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
            isNonEmptyObjectArray(speckleData?.elements) &&
            speckleData?.atomic === true
          ) {
            const elementIds = (speckleData.elements as { referencedId: string }[]).map(
              (obj) => obj.referencedId
            )
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
    if (!nodes || nodes.length === 0 || depth > 20) return false

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
              if (k === 'children' || k === 'elements' || k.includes('displayValue'))
                continue

              const val = speckleData[k] as { referencedId: string }[]
              if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
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
