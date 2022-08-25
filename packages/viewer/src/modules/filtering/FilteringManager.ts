import { Color, Texture, MathUtils } from 'three'
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

  public constructor(renderer: SpeckleRenderer) {
    this.WTI = WorldTree.getInstance()
    this.Renderer = renderer
  }

  public hideObjects(
    objectIds: string[],
    stateKey: string = null,
    includeDescendants = false
  ): FilteringState {
    return this.setVisibilityState(
      objectIds,
      stateKey,
      Command.HIDE,
      includeDescendants
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
    includeDescendants = true
  ): FilteringState {
    return this.setVisibilityState(
      objectIds,
      stateKey,
      Command.ISOLATE,
      includeDescendants
    )
  }

  public unIsolateObjects(
    objectIds: string[],
    stateKey: string = null,
    includeDescendants = true
  ): FilteringState {
    return this.setVisibilityState(
      objectIds,
      stateKey,
      Command.UNISOLATE,
      includeDescendants
    )
  }

  private setVisibilityState(
    objectIds: string[],
    stateKey: string = null,
    command: Command,
    includeDescendants = false
  ): FilteringState {
    if (
      stateKey !== this.StateKey ||
      Math.abs(command - this.VisibilityState.command) > 1
    ) {
      this.VisibilityState.reset()
    }

    this.StateKey = stateKey

    this.VisibilityState.rvs = []

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

  public setColorFilter(prop: PropertyInfo) {
    if (prop.type === 'number') {
      this.ColorStringFilterState = null
      this.ColorNumericFilterState = new ColorNumericFilterState()
      return this.setNumericColorFilter(prop as NumericPropertyInfo)
    }
    if (prop.type === 'string') {
      this.ColorNumericFilterState = null
      this.ColorStringFilterState = new ColorStringFilterState()
      return this.setStringColorFilter(prop as StringPropertyInfo)
    }
  }

  private setNumericColorFilter(numProp: NumericPropertyInfo) {
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
    return this.setFilters()
  }

  private setStringColorFilter(stringProp: StringPropertyInfo) {
    this.ColorStringFilterState.currentProp = stringProp

    const valueGroupColors: ValueGroupColorItemStringProps[] = []
    for (const vg of stringProp.valueGroups) {
      valueGroupColors.push({
        ...vg,
        color: new Color(MathUtils.randInt(0, 0xffffff)),
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
  public highlightObjects(objectIds: string[]) {
    return this.populateGenericState(objectIds, this.HighlightState)
  }

  private populateGenericState(objectIds, state) {
    const ids = [...objectIds, ...this.getDescendantIds(objectIds)]
    state.rvs = []
    state.ids = ids
    if (ids.length !== 0) {
      WorldTree.getInstance().walk((node: TreeNode) => {
        if (!node.model.atomic) return true
        if (!node.model.raw) return true
        if (ids.indexOf(node.model.raw.id) !== -1) {
          state.rvs.push(...WorldTree.getRenderTree().getRenderViewsForNode(node, node))
        }
        return true
      })
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
    }

    const isShowHide =
      this.VisibilityState.command === Command.HIDE ||
      this.VisibilityState.command === Command.SHOW
    const isIsolate =
      this.VisibilityState.command === Command.ISOLATE ||
      this.VisibilityState.command === Command.UNISOLATE

    if (isShowHide || isIsolate) {
      this.Renderer.applyFilter(this.VisibilityState.rvs, {
        filterType: FilterMaterialType.HIDDEN // TODO or ghost if ghosting
      })

      if (isShowHide) returnState.hiddenObjects = this.VisibilityState.ids
      if (isIsolate) returnState.isolatedObjects = this.VisibilityState.ids
    }

    // TODO: colors non matching ghost
    const nonMatchingRvs =
      this.ColorStringFilterState?.nonMatchingRvs ||
      this.ColorNumericFilterState?.nonMatchingRvs
    if (nonMatchingRvs) {
      this.Renderer.applyFilter(nonMatchingRvs, {
        filterType: FilterMaterialType.HIDDEN // TODO: ghost
      })
    }

    if (this.SelectionState.rvs.length !== 0) {
      this.Renderer.applyFilter(this.SelectionState.rvs, {
        filterType: FilterMaterialType.SELECT
      })
    }

    if (this.HighlightState.rvs.length !== 0) {
      this.Renderer.applyFilter(this.HighlightState.rvs, {
        filterType: FilterMaterialType.OVERLAY
      })
    }

    this.Renderer.endFilter()
    this.Renderer.viewer.needsRender = true
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
  public ghost = false
  public ids: string[] = []
  public rvs: NodeRenderView[] = []

  public reset() {
    this.ghost = false
    this.ids = []
    this.rvs = []
  }
}

class ColorStringFilterState {
  public currentProp: StringPropertyInfo
  public colorGroups: ValueGroupColorItemStringProps[]
  public nonMatchingRvs: NodeRenderView[]
  public rampTexture: Texture
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
}

type ValueGroupColorItemNumericProps = {
  rvs: NodeRenderView[]
  value: number
}

class GenericRvState {
  public ids: string[] = []
  public rvs: NodeRenderView[] = []

  public reset() {
    this.rvs = []
    this.ids = []
  }
}
