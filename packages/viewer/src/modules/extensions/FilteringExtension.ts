import stc from 'string-to-color'
import { Color, Texture } from 'three'

import { Assets } from '../Assets.js'
import SpeckleRenderer from '../SpeckleRenderer.js'
import { FilterMaterialType } from '../materials/Materials.js'
import { NodeRenderView } from '../tree/NodeRenderView.js'
import { Extension } from './Extension.js'
import { type TreeNode, WorldTree } from '../tree/WorldTree.js'
import { type IViewer, UpdateFlags, ViewerEvent } from '../../IViewer.js'
import type {
  NumericPropertyInfo,
  PropertyInfo,
  StringPropertyInfo
} from '../filtering/PropertyManager.js'

/** TO DO: Should remove selectedObjects entirely*/
export type FilteringState = {
  selectedObjects?: string[]
  hiddenObjects?: string[]
  isolatedObjects?: string[]
  colorGroups?: {
    value: string
    color: string
    ids: string[]
  }[]
  userColorGroups?: { ids: string[]; color: string }[]
  activePropFilterKey?: string
  passMin?: number | null
  passMax?: number | null
}

export class FilteringExtension extends Extension {
  public WTI: WorldTree
  private Renderer: SpeckleRenderer
  private StateKey: string | undefined = undefined

  private VisibilityState = new VisibilityState()
  private ColorStringFilterState: ColorStringFilterState | null = null
  private ColorNumericFilterState: ColorNumericFilterState | null = null
  private UserspaceColorState: UserspaceColorState | null = new UserspaceColorState()
  private CurrentFilteringState: FilteringState = {} as FilteringState

  public get filteringState(): FilteringState {
    return this.CurrentFilteringState
  }

  public get enabled(): boolean {
    return this._enabled
  }
  public set enabled(value: boolean) {
    this._enabled = value
  }

  public constructor(viewer: IViewer) {
    super(viewer)
    this.WTI = this.viewer.getWorldTree()
    this.Renderer = this.viewer.getRenderer()
  }

  public hideObjects(
    objectIds: string[],
    stateKey: string | undefined = undefined,
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
    stateKey: string | undefined = undefined,
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
    stateKey: string | undefined = undefined,
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
    stateKey: string | undefined = undefined,
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
    stateKey: string | undefined = undefined,
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
    }

    if (command === Command.HIDE || command === Command.ISOLATE) {
      const res = objectIds.reduce(
        (acc: Record<string, unknown>, curr: string) => ((acc[curr] = 1), acc),
        {}
      )
      Object.assign(this.VisibilityState.ids, res)
    }

    const enabled = Object.keys(this.VisibilityState.ids).length !== 0
    if (!enabled) {
      this.VisibilityState.command = Command.NONE
      return this.setFilters()
    }

    this.VisibilityState.command = command

    if (command === Command.HIDE || command === Command.SHOW)
      this.WTI.walk(this.visibilityWalk.bind(this))
    if (command === Command.ISOLATE || command === Command.UNISOLATE) {
      // this.WTI.walk(this.isolationWalk.bind(this))
      const rvMap: Record<string, NodeRenderView> = {}
      this.WTI.walk((node: TreeNode) => {
        if (!node.model.atomic || this.WTI.isRoot(node)) return true
        const rvNodes = this.WTI.getRenderTree().getRenderViewNodesForNode(node)
        if (!this.VisibilityState.ids[node.model.raw.id]) {
          rvNodes.forEach((rvNode: TreeNode) => {
            rvMap[rvNode.model.id] = rvNode.model.renderView
          })
        } else {
          rvNodes.forEach((rvNode: TreeNode) => {
            delete rvMap[rvNode.model.id]
          })
        }
        return true
      })
      this.VisibilityState.rvs = Object.values(rvMap)
    }

    return this.setFilters()
  }

  private visibilityWalk(node: TreeNode): boolean {
    if (this.VisibilityState.ids[node.model.id]) {
      this.VisibilityState.rvs.push(
        ...this.WTI.getRenderTree().getRenderViewsForNode(node)
      )
    }
    return true
  }

  public setColorFilter(prop: PropertyInfo, ghost = true): FilteringState {
    if (prop.type === 'number') {
      this.ColorStringFilterState = null
      return this.setNumericColorFilter(prop as NumericPropertyInfo, ghost)
    }
    if (prop.type === 'string') {
      this.ColorNumericFilterState = null
      return this.setStringColorFilter(prop as StringPropertyInfo, ghost)
    }
    return this.filteringState
  }

  private setNumericColorFilter(numProp: NumericPropertyInfo, ghost: boolean) {
    this.ColorNumericFilterState = new ColorNumericFilterState()
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
    const matchingIds: Record<string, number> = {}
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
      if (!node.model.atomic || this.WTI.isRoot(node) || this.WTI.isSubtreeRoot(node))
        return true

      const rvs = this.WTI.getRenderTree().getRenderViewsForNode(node)
      const idx = matchingIds[node.model.raw.id]
      if (idx === undefined) {
        nonMatchingRvs.push(...rvs)
      } else {
        colorGroups.push({
          rvs,
          value: (idx - passMin) / (passMax - passMin)
        })
      }
      return true
    })

    this.ColorNumericFilterState.colorGroups = colorGroups
    this.ColorNumericFilterState.nonMatchingRvs = nonMatchingRvs
    this.ColorNumericFilterState.ghost = ghost
    this.ColorNumericFilterState.matchingIds = matchingIds
    return this.setFilters()
  }

  private setStringColorFilter(stringProp: StringPropertyInfo, ghost: boolean) {
    this.ColorStringFilterState = new ColorStringFilterState()
    this.ColorStringFilterState.currentProp = stringProp

    const valueGroupColors: ValueGroupColorItemStringProps[] = []
    for (const vg of stringProp.valueGroups) {
      const col = stc(vg.value) // TODO: smarter way needed.
      const entry: ValueGroupColorItemStringProps = {
        ...vg,
        color: new Color(col),
        rvs: [],
        idMap: {}
      }
      /** This is to avoid indexOf inside the walk callback which is ridiculously slow */
      entry.idMap = {}
      for (let k = 0; k < vg.ids.length; k++) {
        entry.idMap[vg.ids[k]] = 1
      }
      valueGroupColors.push(entry)
    }
    const rampTexture = Assets.generateDiscreetRampTexture(
      valueGroupColors.map((v) => v.color.getHex())
    )

    // TODO: note that this does not handle well nested element categories. For example,
    // windows (family instances) inside walls get the same color as the walls, even though
    // they are identified as a different category.
    // 07.05.2023: Attempt on fixing the issue described above. This fixes #1525, but it does
    // add a bit of overhead. Not 100% sure if it breaks anything else tho'
    const nonMatchingMap: Record<string, NodeRenderView> = {}
    this.WTI.walk((node: TreeNode) => {
      if (!node.model.atomic || this.WTI.isRoot(node) || this.WTI.isSubtreeRoot(node)) {
        return true
      }

      const vg = valueGroupColors.find((v: ValueGroupColorItemStringProps) => {
        return v.idMap[node.model.raw.id]
      })
      const rvNodes = this.WTI.getRenderTree().getRenderViewNodesForNode(node)
      if (!vg) {
        rvNodes.forEach(
          (rvNode) =>
            (nonMatchingMap[rvNode.model.renderView.renderData.id] =
              rvNode.model.renderView)
        )

        return true
      }
      const rvs: Array<NodeRenderView> = []

      rvNodes.forEach((value: TreeNode) => {
        if (this.WTI.getRenderTree().getAtomicParent(value) === node) {
          rvs.push(value.model.renderView)
          /** In some cases, the same rv gets put in both non-matching and matching lists because of its hierarchy */
          delete nonMatchingMap[value.model.renderView.renderData.id]
        }
      })

      vg.rvs.push(...rvs)
      return true
    })

    const nonMatchingRvs: NodeRenderView[] = Object.values(nonMatchingMap)
    /** Deleting this since we're not going to use it further */
    for (const vg of valueGroupColors) {
      /** Adamant on this one */
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      delete vg.idMap
    }
    this.ColorStringFilterState.colorGroups = valueGroupColors
    this.ColorStringFilterState.rampTexture = rampTexture
    this.ColorStringFilterState.nonMatchingRvs = nonMatchingRvs
    this.ColorStringFilterState.ghost = ghost
    return this.setFilters()
  }

  public removeColorFilter(): FilteringState {
    if (this.ColorNumericFilterState || this.ColorStringFilterState) {
      this.ColorStringFilterState = null
      this.ColorNumericFilterState = null
      return this.setFilters()
    }
    return this.filteringState
  }

  public setUserObjectColors(
    groups: { objectIds: string[]; color: string }[]
  ): FilteringState {
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

    for (const group of localGroups) {
      for (let k = 0; k < group.objectIds.length; k++) {
        const nodes = this.WTI.findId(group.objectIds[k])
        if (nodes) {
          group.nodes.push(...nodes)
          nodes.forEach((node: TreeNode) => {
            const rvsNodes = this.WTI.getRenderTree()
              .getRenderViewNodesForNode(node)
              .map((rvNode) => rvNode.model.renderView)
            if (rvsNodes) group.rvs.push(...rvsNodes)
          })
        }
      }
    }

    this.UserspaceColorState.groups = localGroups
    const rampTexture = Assets.generateDiscreetRampTexture(
      groups.map((g) => new Color(g.color).getHex())
    )
    this.UserspaceColorState.rampTexture = rampTexture
    return this.setFilters()
  }

  public removeUserObjectColors(): FilteringState {
    this.UserspaceColorState = null
    return this.setFilters()
  }

  public resetFilters(): FilteringState | null {
    this.VisibilityState = new VisibilityState()
    this.ColorStringFilterState = null
    this.ColorNumericFilterState = null
    this.UserspaceColorState = null
    this.StateKey = undefined
    this.Renderer.resetMaterials()
    this.viewer.requestRender(UpdateFlags.RENDER_RESET | UpdateFlags.SHADOWS)
    return null
  }

  private setFilters(): FilteringState {
    this.viewer.getRenderer().resetMaterials()
    this.CurrentFilteringState = {}

    // String based colors
    if (this.ColorStringFilterState) {
      this.CurrentFilteringState.colorGroups = []
      let k = -1
      for (const group of this.ColorStringFilterState.colorGroups) {
        k++
        this.Renderer.setMaterial(group.rvs, {
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
        if (this.ColorStringFilterState.currentProp)
          this.CurrentFilteringState.activePropFilterKey =
            this.ColorStringFilterState.currentProp.key
      }
    }
    // Number based colors
    if (this.ColorNumericFilterState) {
      for (const group of this.ColorNumericFilterState.colorGroups) {
        this.Renderer.setMaterial(group.rvs, {
          filterType: FilterMaterialType.GRADIENT,
          rampIndex: group.value
        })
      }

      /** This doesn't seem to be required as it's called further down */
      // const ghostNonMatching = this.ColorNumericFilterState.nonMatchingRvs
      // if (ghostNonMatching.length) {
      //   this.Renderer.setMaterial(ghostNonMatching, {
      //     filterType: FilterMaterialType.GHOST
      //   })
      // }

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
      this.Renderer.setMaterial(this.VisibilityState.rvs, {
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
      this.Renderer.setMaterial(nonMatchingRvs, {
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
        this.Renderer.setMaterial(group.rvs, {
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

    this.Renderer.viewer.requestRender(
      UpdateFlags.RENDER_RESET | UpdateFlags.SHADOWS | UpdateFlags.CLIPPING_PLANES
    )
    this.emit(ViewerEvent.FilteringStateSet, this.CurrentFilteringState)
    return this.CurrentFilteringState
  }

  private idCache = {} as Record<string, string[]>
  private getDescendantIds(objectIds: string[]): string[] {
    const allIds: string[] = []
    const key = objectIds.join(',')

    if (this.idCache[key] && this.idCache[key].length) return this.idCache[key]

    for (let k = 0; k < objectIds.length; k++) {
      const nodes = this.WTI.findId(objectIds[k])
      if (!nodes) continue
      const node = nodes[0]
      const subtree = node.all((node) => {
        return node.model.raw !== undefined
      })
      const idList = subtree.map((node) => node.model.raw.id)
      allIds.push(...idList)
      this.idCache[node.model.raw.id] = idList
    }
    // this.WTI.walk((node: TreeNode) => {
    //   if (objectIds.includes(node.model.raw.id)) {
    //     const subtree = node.all((node) => {
    //       return node.model.raw !== undefined
    //     })
    //     const idList = subtree.map((node) => node.model.raw.id)
    //     allIds.push(...idList)
    //     this.idCache[node.model.raw.id] = idList
    //   }
    //   return true
    // })

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
  public currentProp: StringPropertyInfo | null
  public colorGroups: ValueGroupColorItemStringProps[]
  public nonMatchingRvs: NodeRenderView[]
  public rampTexture: Texture | undefined
  public ghost = true
  public reset() {
    this.currentProp = null
    this.colorGroups = []
    this.nonMatchingRvs = []
    this.rampTexture = undefined
  }
}

type ValueGroupColorItemStringProps = {
  value: string
  ids: string[]
  color: Color
  rvs: NodeRenderView[]
  idMap: Record<string, number>
}

class ColorNumericFilterState {
  public currentProp!: NumericPropertyInfo
  public nonMatchingRvs!: NodeRenderView[]
  public colorGroups!: ValueGroupColorItemNumericProps[]
  public ghost = true
  public matchingIds!: Record<string, unknown>
}

type ValueGroupColorItemNumericProps = {
  rvs: NodeRenderView[]
  value: number
}

class UserspaceColorState {
  public groups: {
    objectIds: string[]
    color: string
    nodes: TreeNode[]
    rvs: NodeRenderView[]
  }[] = []
  public rampTexture!: Texture
  public reset() {
    this.groups = []
  }
}
