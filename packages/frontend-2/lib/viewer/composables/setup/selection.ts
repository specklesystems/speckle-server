/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { isNonNullable } from '@speckle/shared'
import { TreeNode } from '@speckle/viewer'
import { reduce } from 'lodash-es'
import { SpeckleObject } from '~~/lib/common/helpers/sceneExplorer'
import { useMixpanel } from '~~/lib/core/composables/mp'
import {
  InitialStateWithUrlHashState,
  InjectableViewerState,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { useCameraUtilities, useSelectionUtilities } from '~~/lib/viewer/composables/ui'
import { useSelectionEvents } from '~~/lib/viewer/composables/viewer'

function useCollectSelection() {
  const {
    ui: { selection }
  } = useInjectedViewerState()

  const selectionCallback: Parameters<
    typeof useSelectionEvents
  >[0]['singleClickCallback'] = (_event, { firstVisibleSelectionHit }) => {
    if (!firstVisibleSelectionHit) return (selection.value = null) // reset selection location
    selection.value = firstVisibleSelectionHit.point
  }
  useSelectionEvents({
    singleClickCallback: selectionCallback,
    doubleClickCallback: selectionCallback
  })
}

function useSelectOrZoomOnSelection() {
  const state = useInjectedViewerState()
  const { clearSelection, addToSelection } = useSelectionUtilities()
  const { zoom } = useCameraUtilities()
  const mp = useMixpanel()
  const logger = useLogger()

  const trackAndClearSelection = () => {
    clearSelection()
    mp.track('Viewer Action', {
      type: 'action',
      name: 'selection',
      action: 'clear',
      source: 'viewer'
    })
  }
  useSelectionEvents(
    {
      singleClickCallback: (args, { firstVisibleSelectionHit }) => {
        if (!args) return trackAndClearSelection()
        if (args.hits.length === 0) return trackAndClearSelection()
        if (!args.multiple) clearSelection() // note we're not tracking selectino clearing here

        if (!firstVisibleSelectionHit) return clearSelection()
        addToSelection(firstVisibleSelectionHit.object)
        // Expands default viewer selection behaviour with a special case in diff mode.
        // In diff mode, if we select via a mouse click an object, and that object is
        // "modified", we want to select its pair as well.
        if (
          state.ui.diff.enabled.value &&
          state.ui.diff.result.value &&
          firstVisibleSelectionHit.object.applicationId
        ) {
          const modifiedObjectPairs = state.ui.diff.result.value.modified
          const obj = firstVisibleSelectionHit.object
          const pairedItems = modifiedObjectPairs.find(
            (item) =>
              (item[0].model.raw as SpeckleObject).id === obj.id ||
              (item[1].model.raw as SpeckleObject).id === obj.id
          )
          if (!pairedItems) return

          const pair =
            (pairedItems[0].model.raw as SpeckleObject).id === obj.id
              ? (pairedItems[1].model.raw as SpeckleObject)
              : (pairedItems[0].model.raw as SpeckleObject)
          if (!pair) return
          addToSelection(pair)
        }
        mp.track('Viewer Action', {
          type: 'action',
          name: 'selection',
          action: 'select',
          multiple: args.multiple
        })
      },
      doubleClickCallback: (args, { firstVisibleSelectionHit }) => {
        if (!args) return zoom()
        if (!args.hits) return zoom()
        if (args.hits.length === 0) return zoom()

        const firstVisHit = firstVisibleSelectionHit
        if (!firstVisHit) return clearSelection()

        if (state.ui.filters.selectedObjects.value.length !== 0) {
          const ids = state.ui.filters.selectedObjects.value.map((o) => o.id as string)
          zoom(ids)
        } // else somethingn is weird.
        else {
          logger.warn(
            "Got a double click event but there's no selected object in the state - this should be impossible :)"
          )
        }
        mp.track('Viewer Action', {
          type: 'action',
          name: 'zoom',
          source: 'object-double-click'
        })
      }
    },
    { state }
  )
}

export function useViewerSelectionEventHandler() {
  useCollectSelection()
  useSelectOrZoomOnSelection()
}

type ModelSelectionTreeItem = {
  isSelected: boolean
  oid: string
  children: ModelSelectionTreeItem[]
}

type WorkModelSelectionTree = {
  [modelId: string]: {
    oid: string
    children: ModelSelectionTreeItem[]
  }
}

export type ModelSelectionTree = {
  [modelId: string]: ModelSelectionTreeItem
}

const updateTreeFromSelectionPath = (tree: WorkModelSelectionTree, path: string[]) => {
  // Find any models that are in the path
  const models = Object.values(tree).filter((ti) => path.includes(ti.oid))
  for (const model of models) {
    const modelOidInPath = path.indexOf(model.oid)
    if (modelOidInPath === -1) continue

    const pathFromModel = path.slice(modelOidInPath)
    let currentTreeItem: WorkModelSelectionTree[string] | ModelSelectionTreeItem = model

    for (const pathSegment of pathFromModel) {
      const isLastSegment = pathSegment === pathFromModel[pathFromModel.length - 1]
      const itemIdx = currentTreeItem.children.findIndex((i) => i.oid === pathSegment)
      if (itemIdx === -1) {
        currentTreeItem.children.push({
          oid: pathSegment,
          isSelected: false,
          children: []
        })
      }

      const item: ModelSelectionTreeItem = currentTreeItem.children.find(
        (i) => i.oid === pathSegment
      )!

      if (isLastSegment) item.isSelected = true
      currentTreeItem = item
    }
  }
}

type SpeckleObjectTreeNode = TreeNode & { model: { raw: SpeckleObject } }

export function setupSelectedModelsAndScene(params: {
  state: InitialStateWithUrlHashState
  selectedObjects: InjectableViewerState['ui']['filters']['selectedObjects']
}) {
  if (process.server) {
    return { modelSelectionTree: computed(() => ({})) }
  }

  const {
    state: {
      viewer: {
        metadata: { worldTree }
      },
      resources: {
        response: { modelsAndVersionIds }
      }
    },
    selectedObjects
  } = params

  const results = computed((): ModelSelectionTree => {
    const tree = worldTree.value
    if (!tree) return {}

    const selectedOids = selectedObjects.value.map((o) => o.id).filter(isNonNullable)
    if (!selectedOids.length) return {}

    /**
     * Since the same selected object ID can theoretically appear multiple times as different nodes
     * in the tree, we essentially have to walk the entire tree. So i'm a bit concerned about
     * the performance of this, but we can revisit this later.
     */

    // // Get all selected nodes
    // const selectedNodes: SpeckleObjectTreeNode[] = []
    // tree.walk((node) => {
    //   const typedNode = node as SpeckleObjectTreeNode
    //   const oid = typedNode.model.raw.id || ''
    //   const isSelected = selectedOids.includes(oid)
    //   if (isSelected) {

    //   }

    // })

    const modelObjectMetadata = modelsAndVersionIds.value.map((m) => ({
      model: m.model,
      version: m.version,
      oid: m.version.referencedObject
    }))

    // Init work state
    const workTree: WorkModelSelectionTree = {}
    for (const model of modelObjectMetadata) {
      workTree[model.model.id] = {
        oid: model.oid,
        children: []
      }
    }

    tree.root.walk({ strategy: 'pre' }, (node) => {
      const typedNode = node as SpeckleObjectTreeNode
      const oid = typedNode.model.raw.id || ''
      const isSelected = selectedOids.includes(oid)

      // If not selected, skip
      if (!isSelected) return true

      // Get path to top
      const path = (node.getPath() as SpeckleObjectTreeNode[]).map(
        (i) => i.model.raw.id || ''
      )

      // Check if any of the nodes in the path is one of our models
      const hasFittingModels = modelObjectMetadata.some((m) => path.includes(m.oid))
      if (!hasFittingModels) return true

      updateTreeFromSelectionPath(workTree, path)

      // // Check if any of the nodes in the path is one of our models
      // const fittingModels = modelObjectMetadata.filter((m) => path.includes(m.oid))
      // for (const model of fittingModels) {
      //   if (!resultTree[model.model.id]) {
      //     resultTree[model.model.id] = {
      //       isSelected: false,
      //       oid: model.oid,
      //       children: []
      //     }
      //   }

      //   const pathFromModel = path.slice(path.indexOf(model.oid))
      //   for (const pathSegment of pathFromModel) {
      //     const currentNode = resultTree[model.model.id]
      //   }
      // }

      // // // Find models for which this node is a top-level node
      // // const fittingModels = modelsAndVersionIds.value.filter(
      // //   (i) => i.version.referencedObject === oid
      // // )
      // // for (const model of fittingModels) {
      // //   resultTree[model.model.id] = {
      // //     isSelected,
      // //     oid,
      // //     children: []
      // //   }
      // // }

      return true
    })

    const finalResults: ModelSelectionTree = reduce(
      workTree,
      (res, value, key) => {
        const rootNode = value.children[0]
        if (rootNode) {
          res[key] = rootNode
        }
        return res
      },
      {} as ModelSelectionTree
    )

    return finalResults
  })

  return {
    modelSelectionTree: results
  }
}
