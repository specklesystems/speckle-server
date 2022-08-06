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

enum VisibilityCommand {
  HIDE,
  SHOW
}

enum IsolateCommand {
  ISOLATE,
  UNISOLATE
}

export class FilteringManager {
  private renderer: any

  constructor(renderer: any) {
    this.renderer = renderer
  }

  private setFilters() {
    this.renderer.clearFilter()
    this.renderer.beginFilter()
    let returnFilter

    // TODO apply any color filter?

    if (this.hiddenObjectsState.enabled) {
      this.renderer.applyFilter(this.hiddenObjectsState.hiddenRvs, {
        filterType: this.hiddenObjectsState.ghost ? FilterMaterialType.GHOST : FilterMaterialType.HIDDEN
      })
      returnFilter = this.hiddenObjectsState
    } else if (this.isolateObjectsState.enabled) {
      this.renderer.applyFilter(this.isolateObjectsState.ghostedRvs, {
        filterType: this.isolateObjectsState.ghost ? FilterMaterialType.GHOST : FilterMaterialType.HIDDEN
      })
      returnFilter = this.isolateObjectsState
    }

    this.renderer.endFilter()
    return returnFilter
  }

  public reset() {
    this.renderer.clearFilter()
    this.hiddenObjectsState.reset()
    this.isolateObjectsState.reset()
  }

  private hiddenObjectsState = {
    enabled: false,
    ghost: false,
    filterKey: null,
    ids: [],
    hiddenRvs: [],
    /**
     * Fully resets the state.
     */
    reset() {
      console.log('Hide state was reset')
      this.enabled = false
      this.filterKey = null
      this.ids = []
      this.hiddenRvs = []
    },
    /**
     * Prepares for a clean filtering pass, cleaning any internal renderviews.
     */
    purgeRenderViews() {
      this.hiddenRvs = []
    }
  }

  public hideObjects(objectIds: string[], filterKey: string = null, resourceUrl: string = null, ghost = false) {
    return this.toggleObjectsVisibility(objectIds, VisibilityCommand.HIDE, filterKey, resourceUrl, ghost)
  }

  public showObjects(objectIds: string[], filterKey: string = null, resourceUrl: string = null) {
    return this.toggleObjectsVisibility(objectIds, VisibilityCommand.SHOW, filterKey, resourceUrl)
  }

  private toggleObjectsVisibility(
    objectIds: string[],
    command = VisibilityCommand.HIDE,
    filterKey: string = null,
    resourceUrl: string = null,
    ghost = false
  ) {
    this.isolateObjectsState.reset()
    this.hiddenObjectsState.purgeRenderViews()

    if (this.hiddenObjectsState.filterKey !== filterKey) {
      this.hiddenObjectsState.reset()
    }
    this.hiddenObjectsState.filterKey = filterKey

    if (command === VisibilityCommand.SHOW) {
      this.hiddenObjectsState.ids = this.hiddenObjectsState.ids.filter((val) => objectIds.indexOf(val) === -1)
    }
    if (command === VisibilityCommand.HIDE) {
      this.hiddenObjectsState.ids = [...new Set([...this.hiddenObjectsState.ids, ...objectIds])]
    }

    this.hiddenObjectsState.enabled = this.hiddenObjectsState.ids.length !== 0
    this.hiddenObjectsState.ghost = ghost

    if (this.hiddenObjectsState.enabled) {
      WorldTree.getInstance().walk((node: TreeNode) => {
        if (!node.model.atomic) return true
        if (this.hiddenObjectsState.ids.indexOf(node.model.raw.id) !== -1) {
          this.hiddenObjectsState.hiddenRvs.push(
            ...WorldTree.getRenderTree(resourceUrl).getRenderViewsForNode(node, node)
          )
        }
        return true
      })
    }

    return this.setFilters()
  }

  private isolateObjectsState = {
    enabled: false,
    ghost: true,
    filterKey: null,
    ids: [],
    ghostedRvs: [],
    visibleRvs: [],
    /**
     * Fully resets the state.
     */
    reset() {
      console.log('Isolate state was reset')
      this.enabled = false
      this.ghost = true
      this.filterKey = null
      this.ids = []
      this.ghostedRvs = []
      this.visibleRvs = []
    },
    /**
     * Prepares for a clean filtering pass, cleaning any internal renderviews.
     */
    purgeRenderViews() {
      this.ghostedRvs = []
      this.visibleRvs = []
    }
  }

  public isolateObjects(objectIds: string[], filterKey: string = null, resourceUrl: string = null, ghost = true) {
    return this.toggleObjectsIsolation(objectIds, IsolateCommand.ISOLATE, filterKey, resourceUrl, ghost)
  }
  public unIsolateObjects(objectIds: string[], filterKey: string = null, resourceUrl: string = null) {
    return this.toggleObjectsIsolation(objectIds, IsolateCommand.UNISOLATE, filterKey, resourceUrl)
  }

  private toggleObjectsIsolation(
    objectIds: string[],
    command = IsolateCommand.ISOLATE,
    filterKey: string = null,
    resourceUrl: string = null,
    ghost = true
  ) {
    this.hiddenObjectsState.reset()
    this.isolateObjectsState.purgeRenderViews()

    if (this.isolateObjectsState.filterKey !== filterKey) {
      this.isolateObjectsState.reset()
    }

    if (command === IsolateCommand.UNISOLATE) {
      this.isolateObjectsState.ids = this.isolateObjectsState.ids.filter((val) => objectIds.indexOf(val) === -1)
    }
    if (command === IsolateCommand.ISOLATE) {
      this.isolateObjectsState.ids = [...new Set([...this.isolateObjectsState.ids, ...objectIds])]
    }

    this.isolateObjectsState.enabled = this.isolateObjectsState.ids.length !== 0
    this.isolateObjectsState.ghost = ghost

    if (this.isolateObjectsState.enabled) {
      WorldTree.getInstance().walk((node: TreeNode) => {
        if (!node.model.atomic || node.model.id === 'MOTHERSHIP' || node.model.root) return true
        const rvs = WorldTree.getRenderTree(resourceUrl).getRenderViewsForNode(node, node)
        if (this.isolateObjectsState.ids.indexOf(node.model.raw.id) === -1) {
          this.isolateObjectsState.ghostedRvs.push(...rvs)
        } else {
          // take out rvs ?
          this.isolateObjectsState.ghostedRvs = this.isolateObjectsState.ghostedRvs.filter((rv) => !rvs.includes(rv))
        }
        return true
      })
    }

    return this.setFilters()
  }

  public showTree(objectId: string, resourceUrl: string = null) {
    const ids = this.getDescendantIds(objectId)
    return this.showObjects(ids, null, resourceUrl)
  }

  public hideTree(objectId: string, resourceUrl: string = null) {
    const ids = this.getDescendantIds(objectId)
    return this.hideObjects(ids, null, resourceUrl)
  }

  public isolateTree(objectId: string, resourceUrl: string = null, ghost = true) {
    const ids = this.getDescendantIds(objectId)
    return this.isolateObjects(ids, null, resourceUrl, ghost)
  }

  public unIsolateTree(objectId: string, resourceUrl: string = null, ghost = true) {
    const ids = this.getDescendantIds(objectId)
    return this.unIsolateObjects(ids, null, resourceUrl, ghost)
  }

  private lookupCache = {}
  private getDescendantIds(objectId: string) {
    if (this.lookupCache[objectId]) return this.lookupCache[objectId]
    let rootNode = null
    WorldTree.getInstance().walk((node: TreeNode) => {
      if (!node.model.atomic) return true
      if (node.model.raw.id === objectId) {
        rootNode = node
        return false
      }
      return true
    })
    this.lookupCache[objectId] = Object.keys(rootNode.model.raw.__closure)
    return this.lookupCache[objectId]
  }
}
