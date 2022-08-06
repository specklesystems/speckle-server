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

    // TODO re-apply any color filter?

    if (this.hiddenObjectsState.enabled) {
      console.log('hiding', this.hiddenObjectsState)
      this.renderer.applyFilter(this.hiddenObjectsState.hiddenRvs, {
        filterType: FilterMaterialType.HIDDEN
      })
    } else if (this.isolateObjectsState.enabled) {
      console.log('isolating', this.isolateObjectsState)
      this.renderer.applyFilter(this.isolateObjectsState.ghostedRvs, {
        filterType: FilterMaterialType.GHOST
      })
    }

    this.renderer.endFilter()
  }

  public reset() {
    this.renderer.clearFilter()
    this.hiddenObjectsState.reset()
    this.isolateObjectsState.reset()
  }

  private hiddenObjectsState = {
    enabled: false,
    filterKey: null,
    ids: [],
    hiddenRvs: [],
    /**
     * Fully resets the state.
     */
    reset() {
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

  public hideObjects(objectIds: string[], filterKey: string = null, resourceUrl: string = null) {
    this.toggleObjectsVisibility(objectIds, VisibilityCommand.HIDE, filterKey, resourceUrl)
  }

  public showObjects(objectIds: string[], filterKey: string = null, resourceUrl: string = null) {
    this.toggleObjectsVisibility(objectIds, VisibilityCommand.SHOW, filterKey, resourceUrl)
  }

  private toggleObjectsVisibility(
    objectIds: string[],
    command = VisibilityCommand.HIDE,
    filterKey: string = null,
    resourceUrl: string = null
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

    this.setFilters()
  }

  private isolateObjectsState = {
    enabled: false,
    filterKey: null,
    ids: [],
    ghostedRvs: [],
    visibleRvs: [],
    /**
     * Fully resets the state.
     */
    reset() {
      this.enabled = false
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

  public isolateObjects(objectIds: string[], filterKey: string = null, resourceUrl: string = null) {
    this.toggleObjectsIsolation(objectIds, IsolateCommand.ISOLATE, filterKey, resourceUrl)
  }
  public unIsolateObjects(objectIds: string[], filterKey: string = null, resourceUrl: string = null) {
    this.toggleObjectsIsolation(objectIds, IsolateCommand.UNISOLATE, filterKey, resourceUrl)
  }

  private toggleObjectsIsolation(
    objectIds: string[],
    command = IsolateCommand.ISOLATE,
    filterKey: string = null,
    resourceUrl: string = null
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

    if (this.isolateObjectsState.enabled) {
      WorldTree.getInstance().walk((node: TreeNode) => {
        if (!node.model.atomic || node.model.id === 'MOTHERSHIP' || node.model.root) return true
        const rvs = WorldTree.getRenderTree(resourceUrl).getRenderViewsForNode(node, node)
        if (this.isolateObjectsState.ids.indexOf(node.model.raw.id) === -1) {
          this.isolateObjectsState.ghostedRvs.push(...rvs)
        } else {
          this.isolateObjectsState.visibleRvs.push(node)
        }
        return true
      })
    }

    this.setFilters()
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

    console.log(rootNode.model.raw.__closure)
  }

  public isolateTree() {}

  public unIsolateTree() {}
}
