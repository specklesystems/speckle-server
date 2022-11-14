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

export type FilteringState = {
  test?: Record<string, unknown>
  selectedObjects?: string[]
  hiddenObjects?: string[]
  isolatedObjects?: string[]
  colorGroups?: Record<string, string>[]
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

export interface FilterMaterial {
  filterType: FilterMaterialType
  rampIndex?: number
  rampIndexColor?: Color
  rampTexture?: Texture
}

export class FilteringManager {
  public WTI: WorldTree
  private Renderer: SpeckleRenderer
  private StateKey: string = null

  private VisibilityState = new VisibilityState()
  private ColorStringFilterState = null
  private ColorNumericFilterState = null
  private SelectionState = new GenericRvState()
  private HighlightState = new GenericRvState()
  private UserspaceColorState = new UserspaceColorState()

  public constructor(renderer: SpeckleRenderer) {
    this.WTI = WorldTree.getInstance()
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
      this.VisibilityState.ids = this.VisibilityState.ids.filter(
        (id) => objectIds.indexOf(id) === -1
      )
    }

    if (command === Command.HIDE || command === Command.ISOLATE) {
      this.VisibilityState.ids = [
        ...new Set([...objectIds, ...this.VisibilityState.ids])
      ]
    }

    this.VisibilityState.ids = this.VisibilityState.ids.filter(
      (id) => id !== undefined && id !== null
    )

    const enabled = this.VisibilityState.ids.length !== 0
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
    if (this.VisibilityState.ids.indexOf(node.model.raw.id) !== -1) {
      this.VisibilityState.rvs.push(
        ...WorldTree.getRenderTree().getRenderViewsForNode(node, node)
      )
    }
    return true
  }

  private isolationWalk(node: TreeNode): boolean {
    if (!node.model.atomic || node.model.id === 'MOTHERSHIP') return true
    const rvs = WorldTree.getRenderTree().getRenderViewsForNode(node, node)
    if (this.VisibilityState.ids.indexOf(node.model.raw.id) === -1) {
      this.VisibilityState.rvs.push(...rvs)
    } else {
      // take out rvs that do not match our ids
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

    const matchingIds = numProp.valueGroups
      .filter((p) => p.value >= passMin && p.value <= passMax)
      .map((v) => v.id)
    const matchingValues = numProp.valueGroups
      .filter((p) => p.value >= passMin && p.value <= passMax)
      .map((v) => v.value)

    const nonMatchingRvs: NodeRenderView[] = []
    const colorGroups: ValueGroupColorItemNumericProps[] = []

    WorldTree.getInstance().walk((node: TreeNode) => {
      if (!node.model.atomic || node.model.id === 'MOTHERSHIP' || node.model.root)
        return true
      const rvs = WorldTree.getRenderTree().getRenderViewsForNode(node, node)
      const idx = matchingIds.indexOf(node.model.raw.id)
      if (idx === -1) {
        nonMatchingRvs.push(...rvs)
      } else {
        colorGroups.push({
          rvs,
          value: (matchingValues[idx] - passMin) / (passMax - passMin)
        })
      }
    })
    this.ColorNumericFilterState.colorGroups = colorGroups
    this.ColorNumericFilterState.nonMatchingRvs = nonMatchingRvs
    this.ColorNumericFilterState.ghost = ghost
    this.ColorNumericFilterState.matchingIds = matchingIds
    return this.setFilters()
  }

  // private hashCode = (str): number =>
  //   str.split('').reduce((s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0, 0)

  private setStringColorFilter(stringProp: StringPropertyInfo, ghost) {
    this.ColorStringFilterState.currentProp = stringProp

    const valueGroupColors: ValueGroupColorItemStringProps[] = []
    for (const vg of stringProp.valueGroups) {
      const col = stc(vg.value) // TODO: smarter way needed.
      valueGroupColors.push({
        ...vg,
        color: new Color(col),
        rvs: []
      })
    }
    const rampTexture = Assets.generateDiscreetRampTexture(
      valueGroupColors.map((v) => v.color.getHex())
    )
    const nonMatchingRvs: NodeRenderView[] = []
    // TODO: note that this does not handle well nested element categories. For example,
    // windows (family instances) inside walls get the same color as the walls, even though
    // they are identified as a different category.
    this.WTI.walk((node: TreeNode) => {
      if (!node.model.atomic || node.model.id === 'MOTHERSHIP') {
        return true
      }
      const vg = valueGroupColors.find((v) => v.ids.indexOf(node.model.raw.id) !== -1)
      const rvs = WorldTree.getRenderTree().getRenderViewsForNode(node, node)
      if (!vg) {
        nonMatchingRvs.push(...rvs)
        return true
      }
      vg.rvs.push(...rvs)
      return true
    })

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
    return this.populateGenericState(objectIds, this.SelectionState)
  }
  public highlightObjects(objectIds: string[], ghost = false) {
    this.HighlightState.ghost = ghost
    return this.populateGenericState(objectIds, this.HighlightState)
  }

  public setUserObjectColors(groups: [{ objectIds: string[]; color: string }]) {
    this.UserspaceColorState = new UserspaceColorState()
    for (const group of groups) {
      const state = new ColoredGenericRvState()
      state.ids = [
        ...new Set([...group.objectIds, ...this.getDescendantIds(group.objectIds)])
      ]
      const nodes = []

      WorldTree.getInstance().walk((node: TreeNode) => {
        if (state.ids.indexOf(node.model.raw.id) !== -1) nodes.push(node)
        return true
      })
      for (let k = 0; k < nodes.length; k++) {
        const rvs = WorldTree.getRenderTree().getRenderViewNodesForNode(
          nodes[k],
          nodes[k]
        )
        if (rvs) {
          state.rvs.push(...rvs.map((e) => e.model.renderView))
        }
      }

      this.UserspaceColorState.states.push(state)
    }
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

  private populateGenericState(objectIds, state) {
    let ids = [...objectIds, ...this.getDescendantIds(objectIds)]
    /** There's a log of duplicate ids coming in from 'getDescendantIds'. We remove them
     *  to avoid the large redundancy they incurr otherwise.
     */
    ids = [...Array.from(new Set(ids.map((value) => value)))]
    state.rvs = []
    state.ids = []
    const nodes = []
    if (ids.length !== 0) {
      /** This walk still takes longer than we'd like */
      WorldTree.getInstance().walk((node: TreeNode) => {
        if (ids.indexOf(node.model.raw.id) !== -1) {
          nodes.push(node)
        }
        return true
      })
      for (let k = 0; k < nodes.length; k++) {
        /** There's also quite a lot of redundancy here as well. The nodes coming are
         * hierarchical and we end up getting the same render views more than once.
         */
        const rvs = WorldTree.getRenderTree().getRenderViewNodesForNode(
          nodes[k],
          nodes[k]
        )
        if (rvs) {
          state.rvs.push(...rvs.map((e) => e.model.renderView))
          state.ids.push(...rvs.map((e) => e.model.raw.id))
        }
      }
    }

    return this.setFilters()
  }

  public resetSelection() {
    this.SelectionState = new GenericRvState()
    return this.setFilters()
  }

  public resetHighlight() {
    this.HighlightState = new GenericRvState()
    return this.setFilters()
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
    const returnState: FilteringState = {}

    this.Renderer.clearFilter()
    this.Renderer.beginFilter()

    // String based colors
    if (this.ColorStringFilterState) {
      returnState.colorGroups = []
      let k = -1
      for (const group of this.ColorStringFilterState.colorGroups) {
        k++
        this.Renderer.applyFilter(group.rvs, {
          filterType: FilterMaterialType.COLORED,
          rampIndex: k / this.ColorStringFilterState.colorGroups.length,
          rampIndexColor: group.color,
          rampTexture: this.ColorStringFilterState.rampTexture
        })
        returnState.colorGroups.push({
          value: group.value,
          color: group.color.getHexString(),
          ids: group.ids
        })
        returnState.activePropFilterKey = this.ColorStringFilterState.currentProp.key
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
      returnState.activePropFilterKey = this.ColorNumericFilterState.currentProp.key
      returnState.passMin =
        this.ColorNumericFilterState.currentProp.passMin ||
        this.ColorNumericFilterState.currentProp.min
      returnState.passMax =
        this.ColorNumericFilterState.currentProp.passMax ||
        this.ColorNumericFilterState.currentProp.max

      returnState.isolatedObjects = this.ColorNumericFilterState.matchingIds
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

      if (isShowHide) returnState.hiddenObjects = this.VisibilityState.ids
      if (isIsolate) returnState.isolatedObjects = this.VisibilityState.ids
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
      let m = -1
      for (const state of this.UserspaceColorState.states) {
        m++
        this.Renderer.applyFilter(state.rvs, {
          filterType: FilterMaterialType.COLORED,
          rampIndex: m / this.UserspaceColorState.states.length,
          rampIndexColor: state.color,
          rampTexture: this.UserspaceColorState.rampTexture
        })
      }
    }

    if (this.HighlightState.rvs.length !== 0) {
      this.Renderer.applyFilter(this.HighlightState.rvs, {
        filterType: this.HighlightState.ghost
          ? FilterMaterialType.GHOST
          : FilterMaterialType.OVERLAY
      })
    }

    if (this.SelectionState.rvs.length !== 0) {
      this.Renderer.applyFilter(this.SelectionState.rvs, {
        filterType: FilterMaterialType.SELECT
      })
    }

    this.Renderer.endFilter()
    this.Renderer.viewer.requestRender()
    return returnState
  }

  private idCache = {} as Record<string, string[]>
  private getDescendantIds(objectIds: string[]): string[] {
    const allIds: string[] = []
    const key = objectIds.join(',')

    if (this.idCache[key]) return this.idCache[key]

    this.WTI.walk((node: TreeNode) => {
      if (objectIds.includes(node.model.raw.id) && node.model.raw.__closure) {
        const ids = Object.keys(node.model.raw.__closure)
        allIds.push(...ids)
        this.idCache[node.model.raw.id] = ids
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
  public ids: string[] = []
  public rvs: NodeRenderView[] = []

  public reset() {
    this.ghost = true
    this.ids = []
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
  public ids: string[] = []
  public rvs: NodeRenderView[] = []
  public ghost = false
  public reset() {
    this.rvs = []
    this.ids = []
  }
}

class ColoredGenericRvState extends GenericRvState {
  public color: Color = null
  public reset(): void {
    super.reset()
    this.color = null
  }
}

class UserspaceColorState {
  public states: ColoredGenericRvState[] = []
  public rampTexture: Texture
  public reset() {
    this.states = []
  }
}
