import TreeModel, { type Model } from 'tree-model'
import { NodeRenderView } from './NodeRenderView.js'
import { RenderTree } from './RenderTree.js'
import { AsyncPause } from '../World.js'
import { NodeMap } from './NodeMap.js'
import Logger from '../utils/Logger.js'

export type TreeNode = TreeModel.Node<NodeData>
export type SearchPredicate = (node: TreeNode) => boolean

export interface NodeData {
  id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: { [prop: string]: any }
  children: TreeNode[]
  atomic: boolean
  nestedNodes?: TreeNode[]
  subtreeId?: number
  renderView?: NodeRenderView | null
  instanced?: boolean
  color?: number
}

export class WorldTree {
  private renderTreeInstances: { [id: string]: RenderTree } = {}
  private nodeMaps: { [id: string]: NodeMap } = {}
  private readonly supressWarnings = true
  public static readonly ROOT_ID = 'ROOT'
  private subtreeId: number = 0

  public constructor() {
    this.tree = new TreeModel()
    this._root = this.parse({
      id: WorldTree.ROOT_ID,
      raw: {},
      atomic: true,
      children: [],
      renderView: null
    })
  }

  /** The root render tree will always be non-null because it will always contain the root */
  public getRenderTree(): RenderTree
  public getRenderTree(subtreeId: string): RenderTree | null
  public getRenderTree(subtreeId?: string): RenderTree | null {
    if (!this._root) {
      console.error(`WorldTree not initialised`)
      return null
    }

    const renderTreeRoot = subtreeId ? this.findSubtree(subtreeId) : this.root
    if (!renderTreeRoot) {
      return null
    }
    const subtreeRootId = renderTreeRoot.model.id
    if (!this.renderTreeInstances[subtreeRootId]) {
      this.renderTreeInstances[subtreeRootId] = new RenderTree(this, renderTreeRoot)
    }

    return this.renderTreeInstances[subtreeRootId]
  }

  private tree: TreeModel
  public _root: TreeNode

  public get root(): TreeNode {
    return this._root
  }

  private get nextSubtreeId(): number {
    return ++this.subtreeId
  }

  public get nodeCount(): number {
    let nodeCount = 0
    for (const k in this.nodeMaps) nodeCount += this.nodeMaps[k].nodeCount
    return nodeCount
  }

  public isRoot(node: TreeNode): boolean {
    return node === this._root
  }

  public isSubtreeRoot(node: TreeNode) {
    return node.parent === this._root
  }

  public parse(model: Model<NodeData>): TreeNode {
    return this.tree.parse(model)
  }

  public addSubtree(node: TreeNode) {
    if (this.nodeMaps[node.id]) {
      Logger.error(`Subtree with id ${node.id} already exists!`)
      return
    }
    const subtreeId = this.nextSubtreeId
    node.model.subtreeId = subtreeId
    this.nodeMaps[subtreeId] = new NodeMap(node)
    this._root.addChild(node)
  }

  public addNode(node: TreeNode, parent: TreeNode | null) {
    if (parent === null || parent.model.subtreeId === undefined) {
      Logger.error(`Invalid parent node!`)
      return
    }
    node.model.subtreeId = parent.model.subtreeId
    if (this.nodeMaps[parent.model.subtreeId]?.addNode(node)) parent.addChild(node)
  }

  public removeNode(node: TreeNode, removeChildren: boolean): void {
    const children = node.children
    this.nodeMaps[node.model.subtreeId]?.removeNode(node)
    node.drop()
    if (!removeChildren || !children) return
    for (let k = 0; k < children.length; k++) {
      this.removeNode(children[k], removeChildren)
    }
  }

  public findAll(predicate: SearchPredicate, node?: TreeNode): Array<TreeNode> {
    if (!node && !this.supressWarnings) {
      Logger.warn(`Root will be used for searching. You might not want that`)
    }
    return (node ? node : this.root).all(predicate)
  }

  public findId(id: string, subtreeId?: number): TreeNode[] | null {
    if (!id) return null

    let idNode = null
    if (subtreeId) {
      idNode = this.nodeMaps[subtreeId].getNodeById(id)
    } else {
      for (const k in this.nodeMaps) {
        const nodes = this.nodeMaps[k].getNodeById(id)
        if (nodes) idNode = [...nodes]
      }
    }
    return idNode
  }

  /** TODO: Would rather not have this */
  public findSubtree(id: string) {
    let idNode = null
    for (const k in this.nodeMaps) {
      if ((idNode = this.nodeMaps[k].getSubtreeById(id))) break
    }
    return idNode
  }

  public getAncestors(node: TreeNode): Array<TreeNode> {
    return node.getPath().reverse().slice(1) // We skip the node itself
  }

  public getInstances(subtreeId: string): { [id: string]: Record<string, TreeNode> } {
    return this.nodeMaps[subtreeId].instances
  }

  /** TO DO: We might want to add boolean as return type here too */
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
    async function depthFirstPreOrderAsync(
      callback: SearchPredicate,
      context: TreeNode
    ) {
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
      const subtreeNode = this.findId(subtreeId)
      if (subtreeNode) {
        this.nodeMaps[subtreeNode[0].model.subtreeId].purge()
        delete this.nodeMaps[subtreeNode[0].model.subtreeId]
        // Potentially true?
        this.removeNode(subtreeNode[0], false)
      }
      return
    }

    Object.keys(this.renderTreeInstances).forEach(
      (key) => delete this.renderTreeInstances[key]
    )
    Object.keys(this.nodeMaps).forEach((key) => {
      this.nodeMaps[key].purge
      delete this.nodeMaps[key]
    })

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
