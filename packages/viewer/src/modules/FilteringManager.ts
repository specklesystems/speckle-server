import { Color, Texture } from 'three'
import { TreeNode, WorldTree } from './tree/WorldTree'

export enum FilterMaterialType {
  SELECT,
  GHOST,
  GRADIENT,
  COLORED,
  HIDDEN
}

export interface FilterMaterial {
  filterType: FilterMaterialType
  rampIndex?: number
  rampIndexColor?: Color
  rampTexture?: Texture
}

export class FilteringManager {
  private renderer: any

  constructor(renderer: any) {
    this.renderer = renderer
  }

  public reset() {
    this.renderer.clearFilter()
  }

  private hiddenObjectsState = {
    enabled: false,
    filterKey: null,
    ids: [],
    hiddenRvs: []
  }

  private isolateObjectsState = {
    enabled: false,
    filterKey: null,
    ids: [],
    ghostedRvs: [],
    visibleRvs: []
  }

  private setFilters() {
    //
  }

  public hideObjects(
    objectIds: string[],
    filterKey: string = null,
    resourceUrl: string = null
  ) {
    this.isolateObjectsState.enabled = false

    // Resets visiblity state if filter keys differ.
    if (this.hiddenObjectsState.filterKey !== filterKey)
      this.hiddenObjectsState.ids = []
    this.hiddenObjectsState.filterKey = filterKey

    this.hiddenObjectsState.ids = [
      ...new Set([...this.hiddenObjectsState.ids, ...objectIds])
    ]

    // const toHideNodes = []

    // WorldTree.getInstance().walk((node: TreeNode) => {
    //   if (objectIds.indexOf(node.model.raw.id) !== -1) toHideNodes.push(node)
    //   return true
    // })

    // const renderViews = []
    // for (const node of toHideNodes) {
    //   renderViews.push(...WorldTree.getRenderTree(resourceUrl).getRenderViewsForNode(node, node))
    // }

    // this.renderer.clearFilter()
    // this.renderer.beginFilter()

    // this.renderer.applyFilter(renderViews, {
    //   filterType: FilterMaterialType.HIDDEN
    // })

    // this.renderer.endFilter()
  }

  public showObjects(objectIds: string[]) {
    // TODO
  }

  public showTree() {
    // TODO
  }

  public hideTree(objectId: string) {
    let rootNode = null
    WorldTree.getInstance().walk((node: TreeNode) => {
      if (node.model.raw.id === objectId) {
        rootNode = node
        return false
      }
      return true
    })
    // console.log(rootNode)
    this.hideObjects(rootNode.model.raw.__closure)
  }
}
