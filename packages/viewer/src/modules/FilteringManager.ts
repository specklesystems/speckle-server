import { get } from 'lodash'
import { Color, Texture, MathUtils } from 'three'
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
  private viewer: any
  private renderer: any

  constructor(viewer: any) {
    this.viewer = viewer
    this.renderer = viewer.speckleRenderer
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

  /**
   * Hides a bunch of objects. The opposite of `showObjects`.
   * @param objectIds objects to hide.
   * @param filterKey the "ui scope" this command is coming from.
   * @param resourceUrl the resource url to limit searching to.
   * @param ghost whether to ghost instead of completely hide the objects.
   * @returns the current applied filter state.
   */
  public hideObjects(objectIds: string[], filterKey: string = null, resourceUrl: string = null, ghost = false) {
    return this.toggleObjectsVisibility(objectIds, VisibilityCommand.HIDE, filterKey, resourceUrl, ghost)
  }

  /**
   * Shows a bunch of objects. The opposite of `hideObjects`.
   * @param objectIds objects to hide.
   * @param filterKey the "ui scope" this command is coming from.
   * @param resourceUrl the resource url to limit searching to.
   * @returns the current applied filter state.
   */
  public showObjects(objectIds: string[], filterKey: string = null, resourceUrl: string = null) {
    return this.toggleObjectsVisibility(objectIds, VisibilityCommand.SHOW, filterKey, resourceUrl)
  }

  /**
   * Hides all the descendants of the provided object's id. The opposite of `showTree`.
   * @param objectId the root object id.
   * @param resourceUrl the resource url to limit searching to.
   * @param ghost whether to ghost instead of completely hide the objects.
   * @returns the current applied filter state.
   */
  public hideTree(objectId: string, resourceUrl: string = null, ghost = false) {
    const ids = this.getDescendantIds(objectId)
    return this.hideObjects(ids, null, resourceUrl, ghost)
  }

  /**
   * Shows all the descendants of the provided object's id. The opposite of `hideTree`.
   * @param objectId the root object id.
   * @param resourceUrl the resource url to limit searching to.
   * @returns the current applied filter state.
   */
  public showTree(objectId: string, resourceUrl: string = null) {
    const ids = this.getDescendantIds(objectId)
    return this.showObjects(ids, null, resourceUrl)
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

  /**
   * Isolates a bunch of objects - all other objects in the scene, besides the ones provided, are ghosted or hidden. The opposite of `unIsolateObjects`.
   * @param objectIds objects to isolate.
   * @param filterKey the "ui scope" this command is coming from.
   * @param resourceUrl the resource url to limit searching to.
   * @param ghost whether to ghost instead of completely hide the objects.
   * @returns the current applied filter state.
   */
  public isolateObjects(objectIds: string[], filterKey: string = null, resourceUrl: string = null, ghost = true) {
    return this.toggleObjectsIsolation(objectIds, IsolateCommand.ISOLATE, filterKey, resourceUrl, ghost)
  }

  /**
   * Unisolates a bunch of objects - if previously isolated, the provided objects will be either hidden or ghosted. The opposite of `isolateObjects`.
   * @param objectIds objects to unisolate.
   * @param filterKey the "ui scope" this command is coming from.
   * @param resourceUrl the resource url to limit searching to.
   * @param ghost whether to ghost instead of completely hide the objects.
   * @returns the current applied filter state.
   */
  public unIsolateObjects(objectIds: string[], filterKey: string = null, resourceUrl: string = null) {
    return this.toggleObjectsIsolation(objectIds, IsolateCommand.UNISOLATE, filterKey, resourceUrl)
  }

  /**
   * Isolates the descendants of the provided object. All other objects in the scene, besides the descendants of the one provided, are ghosted or hidden. The opposite of `unIsolateTree`.
   * @param objectId the parent object's id.
   * @param filterKey the "ui scope" this command is coming from.
   * @param resourceUrl the resource url to limit searching to.
   * @param ghost whether to ghost instead of completely hide the objects.
   * @returns the current applied filter state.
   */
  public isolateTree(objectId: string, resourceUrl: string = null, ghost = true) {
    const ids = this.getDescendantIds(objectId)
    return this.isolateObjects(ids, null, resourceUrl, ghost)
  }

  /**
   * Unisolates the descendants of the provided object. All other objects in the scene, besides the descendants of the one provided, are ghosted or hidden. The opposite of `isolateTree`.
   * @param objectId the parent object's id.
   * @param filterKey the "ui scope" this command is coming from.
   * @param resourceUrl the resource url to limit searching to.
   * @param ghost whether to ghost instead of completely hide the objects.
   * @returns the current applied filter state.
   */
  public unIsolateTree(objectId: string, resourceUrl: string = null) {
    const ids = this.getDescendantIds(objectId)
    return this.unIsolateObjects(ids, null, resourceUrl)
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

  public setColorFilter(property: any, resourceUrl: string = null) {
    if (property.type === 'numeric') {
      // do something
    }
    if (property.type === 'string') {
      // do something else
      console.log(Object.keys(property.uniqueValues))
      const keys = Object.keys(property.uniqueValues)

      const colors: { value: string; color: any; rvs: any[] }[] = []

      for (const key of keys) {
        colors.push({
          color: new Color(MathUtils.randInt(0, 0xffffff)).getHex(),
          value: key,
          rvs: []
        })
      }

      WorldTree.getInstance().walk((node: TreeNode) => {
        if (!node.model.atomic) return true

        const propertyValue = get(node.model.raw, property.key, null)
        if (!propertyValue) return true

        const colorData = colors.find((c) => c.value === propertyValue)
        if (!colorData) return true

        const rvs = WorldTree.getRenderTree(resourceUrl).getRenderViewsForNode(node)
        colorData.rvs.push(...rvs)
      })
      console.log(colors)
    }
  }

  public removeColorFilter() {
    // TODO
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
