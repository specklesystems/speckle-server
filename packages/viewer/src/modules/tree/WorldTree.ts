import TreeModel from 'tree-model'
import { DataTree, DataTreeBuilder } from './DataTree'
import { NodeRenderView } from './NodeRenderView'
import { RenderTree } from './RenderTree'
import Logger from 'js-logger'
import { World } from '../World'

export type TreeNode = TreeModel.Node<NodeData>
export type SearchPredicate = (node: TreeNode) => boolean
export type AsyncSearchPredicate = (node: TreeNode) => Promise<boolean>

export interface NodeData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: { [prop: string]: any }
  children: TreeNode[]
  nestedNodes: TreeNode[]
  atomic: boolean
  /**
   * Keeps track wether this the root commit object or not.
   * TODO: Ask Alex wether this is somehow avoidable.
   */
  root: boolean
  renderView?: NodeRenderView
}

export class WorldTree {
  private static instance: WorldTree
  private static renderTreeInstances: { [id: string]: RenderTree } = {}
  private readonly supressWarnings = true

  private constructor() {
    this.tree = new TreeModel()
  }

  public static getInstance(): WorldTree {
    if (!WorldTree.instance) {
      WorldTree.instance = new WorldTree()
      WorldTree.instance._root = WorldTree.getInstance().parse({
        id: 'MOTHERSHIP',
        raw: {},
        atomic: true,
        children: [],
        renderView: null
      })
    }

    return WorldTree.instance
  }

  public static getRenderTree(subtreeId?: string): RenderTree {
    if (!WorldTree.getInstance()._root) {
      console.error(`WorldTree not initialised`)
      return null
    }

    const id = subtreeId ? subtreeId : WorldTree.getInstance().root.model.id
    if (!WorldTree.renderTreeInstances[id]) {
      WorldTree.renderTreeInstances[id] = new RenderTree(
        WorldTree.getInstance().findId(id)
      )
    }

    return WorldTree.renderTreeInstances[id]
  }

  public static getDataTree(): DataTree {
    return DataTreeBuilder.build(WorldTree.instance._root)
  }

  private tree: TreeModel
  public _root: TreeNode

  public get root(): TreeNode {
    return this._root
  }

  public parse(model) {
    return this.tree.parse(model)
  }

  public addSubtree(node: TreeNode) {
    // Logger.warn(`Adding subtree with id: ${node.model.id}`)
    this._root.addChild(node)
  }

  public addNode(node: TreeNode, parent: TreeNode) {
    if (parent === null) {
      Logger.error(`Invalid parent node!`)
      return
    }
    parent.addChild(node)
  }

  public removeNode(node: TreeNode) {
    node.drop()
  }

  public findAll(predicate: SearchPredicate, node?: TreeNode): Array<TreeNode> {
    if (!node && !this.supressWarnings) {
      Logger.warn(`Root will be used for searching. You might not want that`)
    }
    return (node ? node : this.root).all(predicate)
  }

  public findId(id: string, node?: TreeNode) {
    if (!node && !this.supressWarnings) {
      Logger.warn(`Root will be used for searching. You might not want that`)
    }
    return (node ? node : this.root).first((_node: TreeNode) => {
      return _node.model.id === id
    })
  }

  public getAncestors(node: TreeNode): Array<TreeNode> {
    return node.getPath().reverse().slice(1) // We skip the node itself
  }

  public walk(predicate: SearchPredicate, node?: TreeNode): void {
    if (!node && !this.supressWarnings) {
      Logger.warn(`Root will be used for searching. You might not want that`)
    }
    this._root.walk(predicate, node)
  }

  public async walkAsync(
    predicate: SearchPredicate,
    node?: TreeNode,
    priority?: number
  ): Promise<boolean> {
    if (!node && !this.supressWarnings) {
      Logger.warn(`Root will be used for searching. You might not want that`)
    }
    const pause = World.getPause(priority)

    async function* depthFirstPreOrderAsync(callback, context) {
      let i, childCount
      yield callback(context)
      for (i = 0, childCount = context.children.length; i < childCount; i++) {
        yield* depthFirstPreOrderAsync(callback, context.children[i])
      }
    }

    const generator = depthFirstPreOrderAsync(predicate, node ? node : this._root)
    let ret = true
    for await (const step of generator) {
      ret = step
      if (step === false) {
        generator.return()
      }
      await pause()
    }

    return Promise.resolve(ret)
  }

  public purge(subtreeId?: string) {
    if (subtreeId) {
      delete WorldTree.renderTreeInstances[subtreeId]
      this.removeNode(this.findId(subtreeId))
      return
    }

    Object.keys(WorldTree.renderTreeInstances).forEach(
      (key) => delete WorldTree.renderTreeInstances[key]
    )
    this._root.drop()
    this._root.children.length = 0
    this.tree = new TreeModel()
    this._root = WorldTree.getInstance().parse({
      id: 'MOTHERSHIP',
      raw: {},
      atomic: true,
      children: []
    })
  }
}
