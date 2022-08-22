import { TreeNode, WorldTree } from '../tree/WorldTree'
import {
  PropertyInfo,
  StringPropertyInfo,
  NumericPropertyInfo
} from './PropertyManager'
import SpeckleRenderer from '../SpeckleRenderer'

export class FilteringManager {
  public WTI: WorldTree
  private Renderer: SpeckleRenderer
  private StateKey: string = null

  private VisibilityState = new VisibilityState()

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
    includeDescendants = false
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
    includeDescendants = false
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
    if (stateKey !== this.StateKey || command !== this.VisibilityState.command) {
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
    if (!node.model.atomic || node.model.id === 'MOTHERSHIP' || node.model.root)
      return true
    const rvs = WorldTree.getRenderTree().getRenderViewsForNode(node, node)
    if (this.VisibilityState.ids.indexOf(node.model.raw.id) === -1) {
      this.VisibilityState.rvs.push(...rvs)
    } else {
      // take out rvs
      this.VisibilityState.rvs = this.VisibilityState.rvs.filter(
        (rv) => !rvs.includes(rv)
      )
    }
    return true
  }

  public setColorFilter(prop: PropertyInfo) {
    // TODO
  }

  public removeColorFilter() {
    // TODO
  }

  public reset(): FilteringState {
    // TODO
    this.Renderer.clearFilter()
    return null
  }

  private setFilters(): FilteringState {
    console.log(this.VisibilityState)

    const returnState: FilteringState = {}

    this.Renderer.clearFilter()
    this.Renderer.beginFilter()

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

export enum FilterMaterialType {
  SELECT,
  GHOST,
  GRADIENT,
  COLORED,
  OVERLAY,
  HIDDEN
}

export type FilteringState = {
  test?: Record<string, unknown>
  selectedObjects?: string[]
  hiddenObjects?: string[]
  isolatedObjects?: string[]
  colorGroups?: Record<string, string>[]
}

enum Command {
  HIDE,
  SHOW,
  ISOLATE,
  UNISOLATE,
  NONE
}

interface IInternalState {
  ids: string[]
  reset: () => void
}

class VisibilityState implements IInternalState {
  public command = Command.NONE
  public ghost = false
  public ids: string[] = []
  public rvs = []

  public reset() {
    this.ghost = false
    this.ids = []
    this.rvs = []
  }
}
