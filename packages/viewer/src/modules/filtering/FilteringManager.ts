import { Color, Texture } from 'three'
import stc from 'string-to-color'
import { Assets } from '../Assets'
import { TreeNode, WorldTree } from '../tree/WorldTree'
import { NodeRenderView } from '../tree/NodeRenderView'
import {
  PropertyInfo,
  StringPropertyInfo,
  NumericPropertyInfo
} from './PropertyManager'
import SpeckleRenderer from '../SpeckleRenderer'
import EventEmitter from '../EventEmitter'
import { ViewerEvent } from '../../IViewer'
import SpeckleStandardMaterial from '../materials/SpeckleStandardMaterial'
import SpecklePointMaterial from '../materials/SpecklePointMaterial'

export type FilteringState = {
  selectedObjects?: string[]
  hiddenObjects?: string[]
  isolatedObjects?: string[]
  colorGroups?: Record<string, string>[]
  userColorGroups?: { ids: string[]; color: string }[]
  activePropFilterKey?: string
  passMin?: number | null
  passMax?: number | null
}

export enum FilterMaterialType {
  SELECT,
  GHOST,
  GRADIENT,
  COLORED,
  OVERLAY,
  HIDDEN
}

/** This needs to be rethunked */
export interface FilterMaterial {
  filterType: FilterMaterialType
  userMaterial?: SpeckleStandardMaterial
  rampIndex?: number
  rampIndexColor?: Color
  rampTexture?: Texture
}

export class FilteringManager extends EventEmitter {
  public WTI: WorldTree
  private Renderer: SpeckleRenderer
  private StateKey: string = null

  private VisibilityState = new VisibilityState()
  private ColorStringFilterState = null
  private ColorNumericFilterState = null
  private SelectionState = new GenericRvState()
  private HighlightState = new GenericRvState()
  private UserspaceColorState = new UserspaceColorState()
  private ColorStringFilterState2: ColorStringFilterState = null
  private UserMaterialState = new UserMaterialState()
  private CurrentFilteringState: FilteringState = {} as FilteringState

  public constructor(renderer: SpeckleRenderer, tree: WorldTree) {
    super()
    this.WTI = tree
    this.Renderer = renderer
  }

  public hideObjects(
    objectIds: string[],
    stateKey: string = null,
    includeDescendants = false,
    ghost = false
  ): FilteringState {
    return this.setVisibilityState(
      objectIds,
      stateKey,
      Command.HIDE,
      includeDescendants,
      ghost
    )
  }

  public showObjects(
    objectIds: string[],
    stateKey: string = null,
    includeDescendants = false
  ): FilteringState {
    return this.setVisibilityState(
      objectIds,
      stateKey,
      Command.SHOW,
      includeDescendants
    )
  }

  public isolateObjects(
    objectIds: string[],
    stateKey: string = null,
    includeDescendants = true,
    ghost = true
  ): FilteringState {
    return this.setVisibilityState(
      objectIds,
      stateKey,
      Command.ISOLATE,
      includeDescendants,
      ghost
    )
  }

  public unIsolateObjects(
    objectIds: string[],
    stateKey: string = null,
    includeDescendants = true,
    ghost = true
  ): FilteringState {
    return this.setVisibilityState(
      objectIds,
      stateKey,
      Command.UNISOLATE,
      includeDescendants,
      ghost
    )
  }

  private setVisibilityState(
    objectIds: string[],
    stateKey: string = null,
    command: Command,
    includeDescendants = false,
    ghost = false
  ): FilteringState {
    if (
      stateKey !== this.StateKey ||
      Math.abs(command - this.VisibilityState.command) > 1
    ) {
      this.VisibilityState.reset()
    }

    this.StateKey = stateKey

    this.VisibilityState.rvs = []
    this.VisibilityState.ghost = ghost

    if (includeDescendants) {
      objectIds = [...objectIds, ...this.getDescendantIds(objectIds)]
    }

    if (command === Command.SHOW || command === Command.UNISOLATE) {
      /** Not the most elegant, but fast */
      for (let k = 0; k < objectIds.length; k++) {
        if (this.VisibilityState.ids[objectIds[k]])
          delete this.VisibilityState.ids[objectIds[k]]
      }
      // this.VisibilityState.ids = objectIds.reduce(
      //   (acc, curr) => ((acc[curr] = 1), acc),
      //   {}
      // )
    }

    if (command === Command.HIDE || command === Command.ISOLATE) {
      Object.assign(
        this.VisibilityState.ids,
        objectIds.reduce((acc, curr) => ((acc[curr] = 1), acc), {})
      )
      // this.VisibilityState.ids = [
      //   ...new Set([...objectIds, ...this.VisibilityState.ids])
      // ]
    }

    /** Not needed anymore */
    // this.VisibilityState.ids = this.VisibilityState.ids.filter(
    //   (id) => id !== undefined && id !== null
    // )

    const enabled = Object.keys(this.VisibilityState.ids).length !== 0
    if (!enabled) {
      this.VisibilityState.command = Command.NONE
      return this.setFilters()
    }

    this.VisibilityState.command = command

    let walkFunc: (node: TreeNode) => boolean
    if (command === Command.HIDE || command === Command.SHOW)
      walkFunc = this.visibilityWalk
    if (command === Command.ISOLATE || command === Command.UNISOLATE)
      walkFunc = this.isolationWalk
    this.WTI.walk(walkFunc.bind(this))
    return this.setFilters()
  }

  private visibilityWalk(node: TreeNode): boolean {
    if (!node.model.atomic) return true
    if (this.VisibilityState.ids[node.model.raw.id]) {
      this.VisibilityState.rvs.push(
        ...this.WTI.getRenderTree().getRenderViewsForNode(node, node)
      )
    }
    return true
  }

  private isolationWalk(node: TreeNode): boolean {
    if (!node.model.atomic || this.WTI.isRoot(node)) return true
    const rvs = this.WTI.getRenderTree().getRenderViewsForNode(node, node)
    if (!this.VisibilityState.ids[node.model.raw.id]) {
      this.VisibilityState.rvs.push(...rvs)
    } else {
      // take out rvs that do not match our ids
      /** 'includes' still eats up more CPU than we'd like, but improving it
       *  would require too many "risky" changes
       */
      this.VisibilityState.rvs = this.VisibilityState.rvs.filter(
        (rv) => !rvs.includes(rv)
      )
    }
    return true
  }

  public setColorFilter(prop: PropertyInfo, ghost = true) {
    if (prop.type === 'number') {
      this.ColorStringFilterState = null
      this.ColorNumericFilterState = new ColorNumericFilterState()
      return this.setNumericColorFilter(prop as NumericPropertyInfo, ghost)
    }
    if (prop.type === 'string') {
      this.ColorNumericFilterState = null
      this.ColorStringFilterState = new ColorStringFilterState()
      return this.setStringColorFilter(prop as StringPropertyInfo, ghost)
    }
  }

  private setNumericColorFilter(numProp: NumericPropertyInfo, ghost) {
    this.ColorNumericFilterState.currentProp = numProp

    const passMin = numProp.passMin || numProp.min
    const passMax = numProp.passMax || numProp.max

    /** This is the original implementation. Building the ids and values array was not slow per se
     *  but it forced us to use indexOf inside the walk function which was IMMENSELY slow
     */
    // const matchingIds = numProp.valueGroups
    //   .filter((p) => p.value >= passMin && p.value <= passMax)
    //   .map((v) => v.id)

    // const matchingValues = numProp.valueGroups
    //   .filter((p) => p.value >= passMin && p.value <= passMax)
    //   .map((v) => v.value)

    /** This is 'un-functionally' slow to build */
    // let matchingIds = {}
    // matchingIds = numProp.valueGroups.reduce((obj, item) => {
    //   return {
    //     ...obj,
    //     [item['id']]: item.value
    //   }
    // }, matchingIds)

    /** This is very fast to build. It does suffer from the same issue as the original implementation
     *  as in, if there is an id clash (which will happen for instances), the old implementation's indexOf
     *  would return the first value. Here we choose to do the same
     */
    const matchingIds = {}
    for (let k = 0; k < numProp.valueGroups.length; k++) {
      if (matchingIds[numProp.valueGroups[k].id]) {
        continue
      }
      if (
        numProp.valueGroups[k].value >= passMin &&
        numProp.valueGroups[k].value <= passMax
      )
        matchingIds[numProp.valueGroups[k].id] = numProp.valueGroups[k].value
    }

    const nonMatchingRvs: NodeRenderView[] = []
    const colorGroups: ValueGroupColorItemNumericProps[] = []

    this.WTI.walk((node: TreeNode) => {
      if (!node.model.atomic || this.WTI.isRoot(node)) return true

      const rvs = this.WTI.getRenderTree().getRenderViewsForNode(node, node)
      const idx = matchingIds[node.model.raw.id]
      if (!idx) {
        nonMatchingRvs.push(...rvs)
      } else {
        colorGroups.push({
          rvs,
          value: (idx - passMin) / (passMax - passMin)
        })
      }
    })

    this.ColorNumericFilterState.colorGroups = colorGroups
    this.ColorNumericFilterState.nonMatchingRvs = nonMatchingRvs
    this.ColorNumericFilterState.ghost = ghost
    this.ColorNumericFilterState.matchingIds = matchingIds
    return this.setFilters()
  }

  private setStringColorFilter(stringProp: StringPropertyInfo, ghost) {
    this.ColorStringFilterState.currentProp = stringProp

    const valueGroupColors: ValueGroupColorItemStringProps[] = []
    for (const vg of stringProp.valueGroups) {
      const col = stc(vg.value) // TODO: smarter way needed.
      const entry = {
        ...vg,
        color: new Color(col),
        rvs: []
      }
      /** This is to avoid indexOf inside the walk callback which is ridiculously slow */
      entry['idMap'] = {}
      for (let k = 0; k < vg.ids.length; k++) {
        entry['idMap'][vg.ids[k]] = 1
      }
      valueGroupColors.push(entry)
    }
    const rampTexture = Assets.generateDiscreetRampTexture(
      valueGroupColors.map((v) => v.color.getHex())
    )
    const nonMatchingRvs: NodeRenderView[] = []
    // TODO: note that this does not handle well nested element categories. For example,
    // windows (family instances) inside walls get the same color as the walls, even though
    // they are identified as a different category.
    // 07.05.2023: Attempt on fixing the issue described above. This fixes #1525, but it does
    // add a bit of overhead. Not 100% sure if it breaks anything else tho'
    this.WTI.walk((node: TreeNode) => {
      if (!node.model.atomic || this.WTI.isRoot(node)) {
        return true
      }
      const vg = valueGroupColors.find((v) => {
        return v['idMap'][node.model.raw.id]
      })
      const rvNodes = this.WTI.getRenderTree().getRenderViewNodesForNode(node, node)
      if (!vg) {
        nonMatchingRvs.push(...rvNodes.map((rvNode) => rvNode.model.renderView))
        return true
      }
      const rvs = []

      rvNodes.forEach((value: TreeNode) => {
        if (this.WTI.getRenderTree().getAtomicParent(value) === node)
          rvs.push(value.model.renderView)
      })

      vg.rvs.push(...rvs)
      return true
    })
    /** Deleting this since we're not going to use it further */
    for (const vg of valueGroupColors) {
      delete vg['idMap']
    }
    this.ColorStringFilterState.colorGroups = valueGroupColors
    this.ColorStringFilterState.rampTexture = rampTexture
    this.ColorStringFilterState.nonMatchingRvs = nonMatchingRvs
    this.ColorStringFilterState.ghost = ghost
    return this.setFilters()
  }

  public removeColorFilter(): FilteringState {
    this.ColorStringFilterState = null
    this.ColorNumericFilterState = null
    return this.setFilters()
  }

  public selectObjects(objectIds: string[]) {
    this.resetSelection()
    this.populateGenericState(objectIds, this.SelectionState)
    if (this.SelectionState.rvs.length !== 0) {
      this.SelectionState.id = this.Renderer.applyDirectFilter(
        this.SelectionState.rvs,
        {
          filterType: FilterMaterialType.SELECT
        }
      )
    }
    this.Renderer.updateClippingPlanes()
    this.Renderer.viewer.requestRender()
    this.emit(ViewerEvent.FilteringStateSet, this.CurrentFilteringState)
    return this.CurrentFilteringState
  }

  public highlightObjects(objectIds: string[], ghost = false) {
    this.resetHighlight()
    this.HighlightState.ghost = ghost
    this.populateGenericState(objectIds, this.HighlightState)
    if (this.HighlightState.rvs.length !== 0) {
      this.HighlightState.id = this.Renderer.applyDirectFilter(
        this.HighlightState.rvs,
        {
          filterType: FilterMaterialType.OVERLAY
        }
      )
    }
    this.Renderer.viewer.requestRender()
    this.emit(ViewerEvent.FilteringStateSet, this.CurrentFilteringState)
    return this.CurrentFilteringState
  }

  public setUserObjectColors(groups: { objectIds: string[]; color: string }[]) {
    this.UserspaceColorState = new UserspaceColorState()
    // Resetting any other filtering color ops as they're not compatible
    this.ColorNumericFilterState = null
    this.ColorStringFilterState = null

    const localGroups: {
      objectIds: string[]
      color: string
      nodes: TreeNode[]
      rvs: NodeRenderView[]
    }[] = groups.map((g) => {
      return { ...g, nodes: [], rvs: [] }
    })

    this.WTI.walk((node: TreeNode) => {
      if (!node.model?.raw?.id) return true
      for (const group of localGroups) {
        if (group.objectIds.includes(node.model.raw.id)) {
          group.nodes.push(node)
          const rvsNodes = this.WTI.getRenderTree()
            .getRenderViewNodesForNode(node, node)
            .map((rvNode) => rvNode.model.renderView)
          if (rvsNodes) group.rvs.push(...rvsNodes)
        }
      }
      return true
    })

    this.UserspaceColorState.groups = localGroups
    const rampTexture = Assets.generateDiscreetRampTexture(
      groups.map((g) => new Color(g.color).getHex())
    )
    this.UserspaceColorState.rampTexture = rampTexture
    return this.setFilters()
  }

  public removeUserObjectColors() {
    this.UserspaceColorState = null
    return this.setFilters()
  }

  public setUserMaterials(
    groups: {
      objectIds: string[]
      material: SpeckleStandardMaterial | SpecklePointMaterial
      rvs?: NodeRenderView[]
    }[]
  ) {
    this.UserMaterialState = new UserMaterialState()
    const localGroups: {
      objectIds: string[]
      material: SpeckleStandardMaterial | SpecklePointMaterial
      nodes: TreeNode[]
      rvs: NodeRenderView[]
    }[] = groups.map((g) => {
      return { ...g, nodes: [], rvs: g.rvs ? g.rvs : [] }
    })

    this.WTI.walk((node: TreeNode) => {
      if (!node.model?.raw?.id) return true
      for (const group of localGroups) {
        if (group.rvs.length > 0) return true

        if (group.objectIds.includes(node.model.raw.id)) {
          group.nodes.push(node)
          const rvsNodes = this.WTI.getRenderTree()
            .getRenderViewNodesForNode(node, node)
            .map((rvNode) => rvNode.model.renderView)
          if (rvsNodes) group.rvs.push(...rvsNodes)
        }
      }
      return true
    })

    this.UserMaterialState.groups = localGroups
    return this.setFilters()
  }

  public removeUserMaterials() {
    this.UserMaterialState = null
    return this.setFilters()
  }

  private populateGenericState(objectIds, state) {
    let ids = [...objectIds] //, ...this.getDescendantIds(objectIds)]
    /** There's a lot of duplicate ids coming in from 'getDescendantIds'. We remove them
     *  to avoid the large redundancy they incurr otherwise.
     */
    ids = [...Array.from(new Set(ids.map((value) => value)))]
    state.rvs = []
    state.ids = []
    const nodes = []
    if (ids.length !== 0) {
      /** This walk still takes longer than we'd like */
      this.WTI.walk((node: TreeNode) => {
        if (ids.indexOf(node.model.raw.id) !== -1) {
          nodes.push(node)
        }
        return true
      })
      for (let k = 0; k < nodes.length; k++) {
        /** There's also quite a lot of redundancy here as well. The nodes coming are
         * hierarchical and we end up getting the same render views more than once.
         */
        const rvs = this.WTI.getRenderTree().getRenderViewNodesForNode(
          nodes[k],
          nodes[k]
        )
        if (rvs) {
          state.rvs.push(...rvs.map((e) => e.model.renderView))
          state.ids.push(...rvs.map((e) => e.model.raw.id))
        }
      }
    }
  }

  public resetSelection() {
    if (this.SelectionState.rvs.length > 0) {
      this.Renderer.removeDirectFilter(this.SelectionState.id)
    }
    this.SelectionState = new GenericRvState()
    this.Renderer.updateClippingPlanes()
    this.Renderer.viewer.requestRender()
    this.emit(ViewerEvent.FilteringStateSet, this.CurrentFilteringState)
    return this.CurrentFilteringState
  }

  public resetHighlight() {
    if (this.HighlightState.rvs.length > 0) {
      this.Renderer.removeDirectFilter(this.HighlightState.id)
    }
    this.HighlightState = new GenericRvState()
    this.Renderer.viewer.requestRender()
    this.emit(ViewerEvent.FilteringStateSet, this.CurrentFilteringState)
    return this.CurrentFilteringState
  }

  public reset(): FilteringState {
    this.Renderer.clearFilter()
    this.VisibilityState = new VisibilityState()
    this.ColorStringFilterState = null
    this.ColorNumericFilterState = null
    this.SelectionState = new GenericRvState()
    this.HighlightState = new GenericRvState()
    this.UserspaceColorState = null
    this.StateKey = null
    return null
  }

  private setFilters(): FilteringState {
    this.CurrentFilteringState = {}

    this.Renderer.clearFilter()
    this.Renderer.beginFilter()

    //User materials
    if (this.UserMaterialState) {
      for (const group of this.UserMaterialState.groups) {
        this.Renderer.applyMaterial(group.rvs, group.material)
      }
    }

    // String based colors
    if (this.ColorStringFilterState) {
      this.CurrentFilteringState.colorGroups = []
      let k = -1
      for (const group of this.ColorStringFilterState.colorGroups) {
        k++
        this.Renderer.applyFilter(group.rvs, {
          filterType: FilterMaterialType.COLORED,
          rampIndex: k / this.ColorStringFilterState.colorGroups.length,
          rampIndexColor: group.color,
          rampTexture: this.ColorStringFilterState.rampTexture
        })
        this.CurrentFilteringState.colorGroups.push({
          value: group.value,
          color: group.color.getHexString(),
          ids: group.ids
        })
        this.CurrentFilteringState.activePropFilterKey =
          this.ColorStringFilterState.currentProp.key
      }
    }
    // Number based colors
    if (this.ColorNumericFilterState) {
      for (const group of this.ColorNumericFilterState.colorGroups) {
        this.Renderer.applyFilter(group.rvs, {
          filterType: FilterMaterialType.GRADIENT,
          rampIndex: group.value
        })
      }
      this.CurrentFilteringState.activePropFilterKey =
        this.ColorNumericFilterState.currentProp.key
      this.CurrentFilteringState.passMin =
        this.ColorNumericFilterState.currentProp.passMin ||
        this.ColorNumericFilterState.currentProp.min
      this.CurrentFilteringState.passMax =
        this.ColorNumericFilterState.currentProp.passMax ||
        this.ColorNumericFilterState.currentProp.max

      this.CurrentFilteringState.isolatedObjects = Object.keys(
        this.ColorNumericFilterState.matchingIds
      )
    }

    const isShowHide =
      this.VisibilityState.command === Command.HIDE ||
      this.VisibilityState.command === Command.SHOW
    const isIsolate =
      this.VisibilityState.command === Command.ISOLATE ||
      this.VisibilityState.command === Command.UNISOLATE

    if (isShowHide || isIsolate) {
      this.Renderer.applyFilter(this.VisibilityState.rvs, {
        filterType: this.VisibilityState.ghost
          ? FilterMaterialType.GHOST
          : FilterMaterialType.HIDDEN
      })

      if (isShowHide)
        this.CurrentFilteringState.hiddenObjects = Object.keys(this.VisibilityState.ids)
      if (isIsolate)
        this.CurrentFilteringState.isolatedObjects = Object.keys(
          this.VisibilityState.ids
        )
    }

    const nonMatchingRvs =
      this.ColorStringFilterState?.nonMatchingRvs ||
      this.ColorNumericFilterState?.nonMatchingRvs

    let ghostNonMatching = false
    if (this.ColorStringFilterState)
      ghostNonMatching = this.ColorStringFilterState.ghost
    if (this.ColorNumericFilterState)
      ghostNonMatching = this.ColorNumericFilterState.ghost

    if (nonMatchingRvs) {
      this.Renderer.applyFilter(nonMatchingRvs, {
        filterType: ghostNonMatching
          ? FilterMaterialType.GHOST
          : FilterMaterialType.HIDDEN // TODO: ghost
      })
    }

    if (this.UserspaceColorState) {
      this.CurrentFilteringState.userColorGroups = []
      let m = -1
      for (const group of this.UserspaceColorState.groups) {
        m++
        this.Renderer.applyFilter(group.rvs, {
          filterType: FilterMaterialType.COLORED,
          rampIndex: m / this.UserspaceColorState.groups.length,
          rampIndexColor: new Color(group.color),
          rampTexture: this.UserspaceColorState.rampTexture
        })

        this.CurrentFilteringState.userColorGroups.push({
          ids: group.objectIds,
          color: group.color //.getHexString()
        })
      }
    }

    this.Renderer.endFilter()

    /** We apply any preexisting highlights after finishing the filter batch */
    if (this.HighlightState.rvs.length !== 0) {
      this.HighlightState.id = this.Renderer.applyDirectFilter(
        this.HighlightState.rvs,
        {
          filterType: this.HighlightState.ghost
            ? FilterMaterialType.GHOST
            : FilterMaterialType.OVERLAY
        }
      )
    }

    /** We apply any preexisting selections after finishing the filter batch */
    if (this.SelectionState.rvs.length !== 0) {
      this.SelectionState.id = this.Renderer.applyDirectFilter(
        this.SelectionState.rvs,
        {
          filterType: FilterMaterialType.SELECT
        }
      )
    }

    this.Renderer.viewer.requestRender()
    this.emit(ViewerEvent.FilteringStateSet, this.CurrentFilteringState)
    return this.CurrentFilteringState
  }

  private idCache = {} as Record<string, string[]>
  private getDescendantIds(objectIds: string[]): string[] {
    const allIds: string[] = []
    const key = objectIds.join(',')

    if (this.idCache[key] && this.idCache[key].length) return this.idCache[key]
    /** This doesn't return descendants correctly for some streams like:
     * https://speckle.xyz/streams/2f9f2f3021/commits/75bd13f513
     */
    // this.WTI.walk((node: TreeNode) => {
    //   if (objectIds.includes(node.model.raw.id) && node.model.raw.__closure) {
    //     const ids = Object.keys(node.model.raw.__closure)
    //     allIds.push(...ids)
    //     this.idCache[node.model.raw.id] = ids
    //   }
    //   return true
    // })
    this.WTI.walk((node: TreeNode) => {
      if (objectIds.includes(node.model.raw.id)) {
        const subtree = node.all((node) => {
          return node.model.raw !== undefined
        })
        const idList = subtree.map((node) => node.model.raw.id)
        allIds.push(...idList)
        this.idCache[node.model.raw.id] = idList
      }
      return true
    })

    this.idCache[key] = allIds
    return allIds
  }
}

enum Command {
  HIDE = 10,
  SHOW = 11,
  ISOLATE = 20,
  UNISOLATE = 21,
  NONE = 30
}

class VisibilityState {
  public command = Command.NONE
  public ghost = true
  public ids: { [id: string]: number } = {}
  public rvs: NodeRenderView[] = []

  public reset() {
    this.ghost = true
    this.ids = {}
    this.rvs = []
  }
}

class ColorStringFilterState {
  public currentProp: StringPropertyInfo
  public colorGroups: ValueGroupColorItemStringProps[]
  public nonMatchingRvs: NodeRenderView[]
  public rampTexture: Texture
  public ghost = true
  public reset() {
    this.currentProp = null
    this.colorGroups = []
    this.nonMatchingRvs = []
    this.rampTexture = null
  }
}

type ValueGroupColorItemStringProps = {
  value: string
  ids: string[]
  color: Color
  rvs: NodeRenderView[]
}

class ColorNumericFilterState {
  public currentProp: NumericPropertyInfo
  public nonMatchingRvs: NodeRenderView[]
  public colorGroups: ValueGroupColorItemNumericProps[]
  public ghost = true
  public matchingIds: string[]
}

type ValueGroupColorItemNumericProps = {
  rvs: NodeRenderView[]
  value: number
}

class GenericRvState {
  public id: string
  public ids: string[] = []
  public rvs: NodeRenderView[] = []
  public ghost = false
  public reset() {
    this.rvs = []
    this.ids = []
  }
}

class UserspaceColorState {
  public groups: {
    objectIds: string[]
    color: string
    nodes: TreeNode[]
    rvs: NodeRenderView[]
  }[] = []
  public rampTexture: Texture
  public reset() {
    this.groups = []
  }
}

class UserMaterialState {
  public groups: {
    objectIds: string[]
    nodes: TreeNode[]
    rvs: NodeRenderView[]
    material: SpeckleStandardMaterial | SpecklePointMaterial
  }[] = []

  public reset() {
    this.groups = []
  }
}
