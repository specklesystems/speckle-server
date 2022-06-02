import TreeModel from 'tree-model'
import { GeometryData } from './Geometry'
import { Node } from 'tree-model'

export type TreeNode = TreeModel.Node<NodeData>

export interface NodeData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: { [prop: string]: any }
  geometry: GeometryData
}

export class WorldTree {
  private static instance: WorldTree

  private constructor() {
    this.tree = new TreeModel()
  }

  public static getInstance(): WorldTree {
    if (!WorldTree.instance) {
      WorldTree.instance = new WorldTree()
    }

    return WorldTree.instance
  }

  private tree: TreeModel
  private _root: TreeModel.Node<NodeData>

  public get root(): TreeModel.Node<NodeData> {
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

  public findAll() {
    return this.root.all((node: Node<NodeData>) => {
      // const type = node.model.raw.speckle_type.split('.').reverse()[0]
      return node.model.raw.displayValue !== undefined //type === 'Polyline'
    })
  }
}
