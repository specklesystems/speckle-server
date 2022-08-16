import { Color, Texture, MathUtils } from 'three'
import flatten from '../helpers/flatten'
import { TreeNode, WorldTree } from './tree/WorldTree'
import { Assets } from './Assets'
import { NodeRenderView } from './tree/NodeRenderView'

export enum FilterMaterialType {
  SELECT,
  GHOST,
  GRADIENT,
  COLORED,
  OVERLAY,
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

export interface PropertyInfo {
  key: string
  count: number
  objectCount: number
  type: 'number' | 'string'
}

export interface NumericPropertyInfo extends PropertyInfo {
  min: number
  max: number
  valueGroups: [{ value: number; id: string }]
}

export interface StringPropertyInfo extends PropertyInfo {
  valueGroups: [{ value: string; ids: string[] }]
}

export class FilteringManager {
  private renderer: any

  constructor(viewer: any) {
    this.renderer = viewer.speckleRenderer
  }

  /**
   * Applies all current filter states in the expected order. Namely:
   * - first pass: colours objects if a property color filter is set
   * - second pass: normal visibility/isolation
   * - third pass: hides non matching elements if a property color filter is set
   * - fourth pass: selection highlights
   */
  private setFilters() {
    this.renderer.clearFilter()
    this.renderer.beginFilter()
    const returnFilter = {} as any

    // First: colour things!
    if (this.colorFilterState.enabled) {
      if (this.colorFilterState.type === 'string') {
        let k = -1
        for (const group of this.colorFilterState.colors) {
          k++
          this.renderer.applyFilter(group.rvs, {
            filterType: FilterMaterialType.COLORED,
            rampIndex: k / this.colorFilterState.colors.length,
            rampIndexColor: new Color(group.color),
            rampTexture: this.colorFilterState.rampTexture
          })
        }
      }

      if (this.colorFilterState.type === 'number') {
        for (const group of this.colorFilterState.colors) {
          this.renderer.applyFilter(group.rvs, {
            filterType: FilterMaterialType.GRADIENT,
            rampIndex: group.value
          })
        }
      }
      returnFilter.coloringState = this.colorFilterState.getState()
    }

    // Second: hide objects/isolate objects.
    if (this.hiddenObjectsState.enabled) {
      this.renderer.applyFilter(this.hiddenObjectsState.hiddenRvs, {
        filterType: this.hiddenObjectsState.ghost
          ? FilterMaterialType.GHOST
          : FilterMaterialType.HIDDEN
      })
      returnFilter.visibilityState = this.hiddenObjectsState.getState()
    } else if (this.isolateObjectsState.enabled) {
      this.renderer.applyFilter(this.isolateObjectsState.ghostedRvs, {
        filterType: this.isolateObjectsState.ghost
          ? FilterMaterialType.GHOST
          : FilterMaterialType.HIDDEN
      })

      returnFilter.visibilityState = this.isolateObjectsState.getState()
    }

    // Third: The color filter state gets a last pass as we always want to hide/ghost
    // elements that do not match.
    if (
      this.colorFilterState.enabled &&
      this.colorFilterState.ghostNonMatchingObjects
    ) {
      this.renderer.applyFilter(this.colorFilterState.nonMatchingRvs, {
        filterType: FilterMaterialType.HIDDEN
      })
    }

    // Lastly, highlight any selected objects
    if (this.selectionObjectsState.rvs.length !== 0) {
      this.renderer.applyFilter(this.selectionObjectsState.rvs, {
        filterType: FilterMaterialType.SELECT
      })
    }

    // TODO: overlay pass.

    this.renderer.endFilter()
    return returnFilter
  }

  /**
   * Resets all current filters (visibility, isolation, colors and selection)
   */
  public reset() {
    this.renderer.clearFilter()
    this.hiddenObjectsState.reset()
    this.isolateObjectsState.reset()
    this.colorFilterState.reset()
    this.selectionObjectsState.reset()

    return this.setFilters()
  }

  private selectionObjectsState = {
    rvs: [],
    reset() {
      this.rvs = []
    }
  }

  public selectRv(rv: NodeRenderView, append = true) {
    if (append) this.selectionObjectsState.rvs.push(rv)
    else this.selectionObjectsState.rvs = [rv]
    return this.setFilters()
  }

  public resetSelection() {
    this.selectionObjectsState.reset()
    return this.setFilters()
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
    },
    getState() {
      return {
        name: 'hiddenObjectState',
        enabled: this.enabled,
        filterKey: this.filterKey,
        ids: this.ids
      }
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
  public hideObjects(
    objectIds: string[],
    filterKey: string = null,
    resourceUrl: string = null,
    ghost = false
  ) {
    return this.toggleObjectsVisibility(
      this.getAllDescendantIds(objectIds),
      VisibilityCommand.HIDE,
      filterKey,
      resourceUrl,
      ghost
    )
  }

  /**
   * Shows a bunch of objects. The opposite of `hideObjects`.
   * @param objectIds objects to hide.
   * @param filterKey the "ui scope" this command is coming from.
   * @param resourceUrl the resource url to limit searching to.
   * @returns the current applied filter state.
   */
  public showObjects(
    objectIds: string[],
    filterKey: string = null,
    resourceUrl: string = null
  ) {
    return this.toggleObjectsVisibility(
      this.getAllDescendantIds(objectIds),
      VisibilityCommand.SHOW,
      filterKey,
      resourceUrl
    )
  }

  /**
   * Hides all the descendants of the provided object's id. The opposite of `showTree`.
   * @param objectId the root object id.
   * @param filterKey the "ui scope" this command is coming from.
   * @param resourceUrl the resource url to limit searching to.
   * @param ghost whether to ghost instead of completely hide the objects.
   * @returns the current applied filter state.
   */
  public hideTree(
    objectId: string,
    filterKey: string = null,
    resourceUrl: string = null,
    ghost = false
  ) {
    const ids = this.getDescendantIds(objectId)
    return this.hideObjects(ids, filterKey, resourceUrl, ghost)
  }

  /**
   * Shows all the descendants of the provided object's id. The opposite of `hideTree`.
   * @param objectId the root object id.
   * @param resourceUrl the resource url to limit searching to.
   * @returns the current applied filter state.
   */
  public showTree(
    objectId: string,
    filterKey: string = null,
    resourceUrl: string = null
  ) {
    const ids = this.getDescendantIds(objectId)
    return this.showObjects(ids, filterKey, resourceUrl)
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
      this.hiddenObjectsState.ids = this.hiddenObjectsState.ids.filter(
        (val) => objectIds.indexOf(val) === -1
      )
    }
    if (command === VisibilityCommand.HIDE) {
      this.hiddenObjectsState.ids = [
        ...new Set([...this.hiddenObjectsState.ids, ...objectIds])
      ]
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
    },
    getState() {
      return {
        name: 'isolateObjectsState',
        enabled: this.enabled,
        filterKey: this.filterKey,
        ids: this.ids
      }
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
  public isolateObjects(
    objectIds: string[],
    filterKey: string = null,
    resourceUrl: string = null,
    ghost = true
  ) {
    return this.toggleObjectsIsolation(
      this.getAllDescendantIds(objectIds),
      IsolateCommand.ISOLATE,
      filterKey,
      resourceUrl,
      ghost
    )
  }

  /**
   * Unisolates a bunch of objects - if previously isolated, the provided objects will be either hidden or ghosted. The opposite of `isolateObjects`.
   * @param objectIds objects to unisolate.
   * @param filterKey the "ui scope" this command is coming from.
   * @param resourceUrl the resource url to limit searching to.
   * @param ghost whether to ghost instead of completely hide the objects.
   * @returns the current applied filter state.
   */
  public unIsolateObjects(
    objectIds: string[],
    filterKey: string = null,
    resourceUrl: string = null,
    ghost = true
  ) {
    return this.toggleObjectsIsolation(
      this.getAllDescendantIds(objectIds),
      IsolateCommand.UNISOLATE,
      filterKey,
      resourceUrl,
      ghost
    )
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
      this.isolateObjectsState.ids = this.isolateObjectsState.ids.filter(
        (val) => objectIds.indexOf(val) === -1
      )
    }
    if (command === IsolateCommand.ISOLATE) {
      this.isolateObjectsState.ids = [
        ...new Set([...this.isolateObjectsState.ids, ...objectIds])
      ]
    }

    this.isolateObjectsState.enabled = this.isolateObjectsState.ids.length !== 0
    this.isolateObjectsState.ghost = ghost
    this.isolateObjectsState.filterKey = filterKey

    // Thinking: ghosted rvs = everyhting
    // subtract out of ghosted rvs the rvs coming from elements i do not want to hide
    if (this.isolateObjectsState.enabled) {
      WorldTree.getInstance().walk((node: TreeNode) => {
        if (!node.model.atomic || node.model.id === 'MOTHERSHIP' || node.model.root)
          return true
        const rvs = WorldTree.getRenderTree(resourceUrl).getRenderViewsForNode(
          node,
          node
        )
        if (this.isolateObjectsState.ids.indexOf(node.model.raw.id) === -1) {
          this.isolateObjectsState.ghostedRvs.push(...rvs)
        } else {
          // take out rvs ?
          this.isolateObjectsState.ghostedRvs =
            this.isolateObjectsState.ghostedRvs.filter((rv) => !rvs.includes(rv))
        }
        return true
      })
    }

    return this.setFilters()
  }

  private colorFilterState = {
    enabled: false,
    type: null as string,
    key: null as string,
    colors: [],
    rampTexture: null as Texture,
    nonMatchingRvs: [],
    ghostNonMatchingObjects: true,
    reset() {
      this.enabled = false
      this.type = null
      this.key = null
      this.colors = []
      this.nonMatchingRvs = []
      this.rampTexture = null
      this.ghostNonMatchingObjects = true
      console.log('Color filter state was reset, yo!')
    },
    getState() {
      return {
        name: 'colorFilterState',
        enabled: this.enabled,
        type: this.type,
        key: this.key,
        colors: this.colors
      }
    }
  }

  public setColorFilter(
    property: any,
    resourceUrl: string = null,
    ghostNonMatchingObjects = true
  ) {
    this.colorFilterState.reset() // debugging only
    if (this.colorFilterState.key === property.key) return
    // TODO: reset states etc.
    this.colorFilterState.enabled = true

    if (property.type === 'number') {
      const passMin = property.passMin || property.min
      const passMax = property.passMax || property.max
      const matchingIds = property.valueGroups
        .filter((p) => p.value >= passMin && p.value <= passMax)
        .map((v) => v.id)
      const matchingValues = property.valueGroups
        .filter((p) => p.value >= passMin && p.value <= passMax)
        .map((v) => v.value)

      const nonMatchingRvs = []
      const matchingRvs = []
      // const valueGroupColors = ]
      WorldTree.getInstance().walk((node: TreeNode) => {
        if (!node.model.atomic || node.model.id === 'MOTHERSHIP' || node.model.root)
          return true
        const rvs = WorldTree.getRenderTree(resourceUrl).getRenderViewsForNode(
          node,
          node
        )
        const idx = matchingIds.indexOf(node.model.raw.id)
        if (idx === -1) {
          nonMatchingRvs.push(...rvs)
        } else {
          //TODO
          const t = (matchingValues[idx] - passMin) / (passMax - passMin)
          matchingRvs.push({
            rvs,
            value: t
          })
        }
      })

      this.colorFilterState.nonMatchingRvs = nonMatchingRvs
      this.colorFilterState.colors = matchingRvs
    }
    if (property.type === 'string') {
      const valueGroupColors = []
      for (const valueGroup of property.valueGroups) {
        valueGroupColors.push({
          ...valueGroup, // [value, ids[] ]
          color: new Color(MathUtils.randInt(0, 0xffffff)).getHex(),
          rvs: []
        })
      }

      const rampTexture = Assets.generateDiscreetRampTexture(
        valueGroupColors.map((v) => v.color)
      )

      // TODO: keep track of the non-matching elements?
      const nonMatchingRvs = []
      WorldTree.getInstance().walk((node: TreeNode) => {
        if (!node.model.atomic || node.model.id === 'MOTHERSHIP' || node.model.root)
          return true
        const vg = valueGroupColors.find((v) => v.ids.indexOf(node.model.raw.id) !== -1)
        const rvs = WorldTree.getRenderTree(resourceUrl).getRenderViewsForNode(
          node,
          node
        )
        if (!vg) {
          nonMatchingRvs.push(...rvs)
          return true
        }
        vg.rvs.push(...rvs)
        return true
      })

      this.colorFilterState.colors = valueGroupColors
      this.colorFilterState.rampTexture = rampTexture
      this.colorFilterState.nonMatchingRvs = nonMatchingRvs
      // return valueGroupColors
    }
    this.colorFilterState.key = property.key
    this.colorFilterState.type = property.type
    this.colorFilterState.ghostNonMatchingObjects = ghostNonMatchingObjects

    return this.setFilters()
  }

  public removeColorFilter() {
    // TODO
    this.colorFilterState.enabled = false
  }

  // TODO: merge/reuse the two functions below.
  private singleIdDesclookupCache = {}
  private getDescendantIds(objectId: string) {
    if (this.singleIdDesclookupCache[objectId])
      return this.singleIdDesclookupCache[objectId]
    let rootNode = null
    WorldTree.getInstance().walk((node: TreeNode) => {
      if (node.model.raw.id === objectId) {
        rootNode = node
        return false
      }
      return true
    })

    if (rootNode.model.raw.__closure) {
      this.singleIdDesclookupCache[objectId] = [
        ...Object.keys(rootNode.model.raw.__closure),
        objectId
      ]
    } else {
      this.singleIdDesclookupCache[objectId] = [objectId]
    }
    return this.singleIdDesclookupCache[objectId]
  }

  private multIdDesclookupCache = {}
  private getAllDescendantIds(objectIds: string[]) {
    const allIds = []
    const key = objectIds.join(',')
    if (this.multIdDesclookupCache[key]) return this.multIdDesclookupCache[key]
    WorldTree.getInstance().walk((node: TreeNode) => {
      if (objectIds.includes(node.model.raw.id) && node.model.raw.__closure) {
        allIds.push(...Object.keys(node.model.raw.__closure))
      }
      return true
    })
    this.multIdDesclookupCache[key] = [...allIds, ...objectIds]
    return this.multIdDesclookupCache[key]
  }

  /**
   * Tries to handle a legacy filter
   * @param filter legacy filter to handle
   */
  public handleLegacyFilter(filter) {
    // TODO
    console.warn('Not yet implemented.')
  }

  /**
   * Trawls the scene for all atomic objects's properties and groups them
   * by property & value.
   * @returns a list of unique property info objects.
   */
  public getAllPropertyFilters(): PropertyInfo[] {
    const propValues = {}

    WorldTree.getInstance().walk((node: TreeNode) => {
      if (!node.model.atomic) return true
      const obj = flatten(node.model.raw)
      for (const key in obj) {
        if (Array.isArray(obj[key])) continue
        if (!propValues[key]) propValues[key] = []
        propValues[key].push({ value: obj[key], id: obj.id })
      }
    })

    const allPropInfos: PropertyInfo[] = []

    for (const propKey in propValues) {
      const propValuesArr = propValues[propKey]
      const propInfo = {} as any
      propInfo.key = propKey
      propInfo.type = typeof propValuesArr[0].value
      propInfo.objectCount = propValuesArr.length

      // For string based props, keep track of which ids belong to which group
      if (propInfo.type === 'string') {
        const valueGroups = {}
        for (const { value, id } of propValuesArr) {
          if (!valueGroups[value]) valueGroups[value] = []
          valueGroups[value].push(id)
        }
        const valueMaps = []
        for (const key in valueGroups)
          valueMaps.push({ value: key, ids: valueGroups[key] })

        propInfo.valueGroups = valueMaps
      }
      // For numeric props, we keep track of min and max and all the {id, val}s
      if (propInfo.type === 'number') {
        propInfo.min = Number.MAX_VALUE
        propInfo.max = Number.MIN_VALUE
        for (const { value } of propValuesArr) {
          if (value < propInfo.min) propInfo.min = value
          if (value > propInfo.max) propInfo.max = value
        }
        propInfo.valueGroups = propValuesArr.sort((a, b) => a.value - b.value)
        // const sorted = propValuesArr.sort((a, b) => a.value - b.value)
        // propInfo.sortedValues = sorted.map(s => s.value)
        // propInfo.sortedIds = sorted.map(s => s.value) // tl;dr: not worth it
      }
      allPropInfos.push(propInfo)
    }

    return allPropInfos
  }
}
