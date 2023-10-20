import TreeModel from 'tree-model'
import { NodeRenderView } from './NodeRenderView'
import { RenderTree } from './RenderTree'
import Logger from 'js-logger'
import { AsyncPause } from '../World'
import { NodeMap } from './NodeMap'

export type TreeNode = TreeModel.Node<NodeData>
export type SearchPredicate = (node: TreeNode) => boolean
export type AsyncSearchPredicate = (node: TreeNode) => Promise<boolean>

export interface NodeData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: { [prop: string]: any }
  children: TreeNode[]
  nestedNodes: TreeNode[]
  atomic: boolean
  renderView?: NodeRenderView
}

export class WorldTree {
  private renderTreeInstances: { [id: string]: RenderTree } = {}
  private readonly supressWarnings = true
  public static readonly ROOT_ID = 'ROOT'
  public nodeMap: NodeMap

  public constructor() {
    this.tree = new TreeModel()
    this.nodeMap = new NodeMap()
    this._root = this.parse({
      id: WorldTree.ROOT_ID,
      raw: {},
      atomic: true,
      children: [],
      renderView: null
    })
  }

  public getRenderTree(subtreeId?: string): RenderTree {
    if (!this._root) {
      console.error(`WorldTree not initialised`)
      return null
    }

    const id = subtreeId ? subtreeId : this.root.model.id

    if (!this.renderTreeInstances[id]) {
      this.renderTreeInstances[id] = new RenderTree(this, this.findSubtree(id))
    }

    return this.renderTreeInstances[id]
  }

  private tree: TreeModel
  public _root: TreeNode

  public get root(): TreeNode {
    return this._root
  }

  public get nodeCount() {
    return this.nodeMap.nodeCount
  }

  public isRoot(node: TreeNode) {
    return node === this._root
  }

  public parse(model) {
    return this.tree.parse(model)
  }

  public addSubtree(node: TreeNode) {
    this._root.addChild(node)
    this.nodeMap.addSubtree(node)
  }

  public addNode(node: TreeNode, parent: TreeNode) {
    if (parent === null) {
      Logger.error(`Invalid parent node!`)
      return
    }
    parent.addChild(node)
    this.nodeMap.addNode(node)
  }

  public removeNode(node: TreeNode) {
    node.drop()
    this.nodeMap.removeNode(node)
  }

  public findAll(predicate: SearchPredicate, node?: TreeNode): Array<TreeNode> {
    if (!node && !this.supressWarnings) {
      Logger.warn(`Root will be used for searching. You might not want that`)
    }
    return (node ? node : this.root).all(predicate)
  }

  // public findId(id: string, node?: TreeNode) {
  //   if (!node && !this.supressWarnings) {
  //     Logger.warn(`Root will be used for searching. You might not want that`)
  //   }
  //   return (node ? node : this.root).first((_node: TreeNode) => {
  //     return _node.model.id === id
  //   })
  // }

  public findId(id: string, node?: TreeNode) {
    if (!node && !this.supressWarnings) {
      Logger.warn(`Root will be used for searching. You might not want that`)
    }
    return this.nodeMap.getNodeById(id)
  }

  public findSubtree(id: string) {
    return this.nodeMap.getSubtreeById(id)
  }

  public hasId(id: string) {
    return this.nodeMap.hasId(id)
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
    node?: TreeNode
  ): Promise<boolean> {
    if (!node && !this.supressWarnings) {
      Logger.warn(`Root will be used for searching. You might not want that`)
    }
    const pause = new AsyncPause()

    let success = true
    async function depthFirstPreOrderAsync(callback, context) {
      let i, childCount
      pause.tick(100)
      if (pause.needsWait) {
        await pause.wait(16)
      }

      success &&= callback(context)

      for (i = 0, childCount = context.children.length; i < childCount; i++) {
        if (!(await depthFirstPreOrderAsync(callback, context.children[i]))) break
      }
      return success
    }

    return depthFirstPreOrderAsync(predicate, node ? node : this._root)
  }

  public purge(subtreeId?: string) {
    if (subtreeId) {
      delete this.renderTreeInstances[subtreeId]
      this.removeNode(this.findId(subtreeId)[0])
      return
    }

    Object.keys(this.renderTreeInstances).forEach(
      (key) => delete this.renderTreeInstances[key]
    )
    this._root.drop()
    this._root.children.length = 0
    this.tree = new TreeModel()
    this._root = this.tree.parse({
      id: WorldTree.ROOT_ID,
      raw: {},
      atomic: true,
      children: []
    })
  }
}
