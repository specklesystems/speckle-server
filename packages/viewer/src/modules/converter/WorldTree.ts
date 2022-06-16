import TreeModel from 'tree-model'
import { NodeRenderView } from '../NodeRenderView'
import { RenderTree } from '../RenderTree'

export type TreeNode = TreeModel.Node<NodeData>
export type SearchPredicate = (node: TreeNode) => boolean

export interface NodeData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: { [prop: string]: any }
  atomic: boolean
  renderView?: NodeRenderView
}

export class WorldTree {
  private static instance: WorldTree
  private static renderTreeInstance: RenderTree

  private constructor() {
    this.tree = new TreeModel()
  }

  public static getInstance(): WorldTree {
    if (!WorldTree.instance) {
      WorldTree.instance = new WorldTree()
    }

    return WorldTree.instance
  }

  public static getRenderTree(): RenderTree {
    if (!WorldTree.getInstance()._root) {
      console.error(`WorldTree not initialised`)
      return null
    }
    if (!WorldTree.renderTreeInstance) {
      WorldTree.renderTreeInstance = new RenderTree(WorldTree.getInstance()._root)
    }

    return WorldTree.renderTreeInstance
  }

  private tree: TreeModel
  private _root: TreeNode

  public get root(): TreeNode {
    return this._root
  }

  public parse(model) {
    return this.tree.parse(model)
  }

  public addNode(node: TreeNode, parent: TreeNode) {
    if (parent === null) {
      this._root = node
      return
    }
    parent.addChild(node)
  }

  public findAll(predicate: SearchPredicate, node?: TreeNode): Array<TreeNode> {
    return (node ? node : this.root).all(predicate)
  }

  public findId(id: string, node?: TreeNode) {
    return (node ? node : this.root).first((_node: TreeNode) => {
      return _node.model.id === id
    })
  }

  public getAncestors(node: TreeNode): Array<TreeNode> {
    return node.getPath().reverse().slice(1) // We skip the node itself
  }
}
