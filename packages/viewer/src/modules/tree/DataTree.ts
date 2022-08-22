import TreeModel from 'tree-model'
import { TreeNode, WorldTree } from './WorldTree'

export type SpeckleObject = Record<string, unknown>
export type ObjectPredicate = (obj: SpeckleObject) => boolean

export interface DataTree {
  findFirst(predicate: ObjectPredicate): SpeckleObject
  findAll(predicate: ObjectPredicate): SpeckleObject[]
  walk(predicate: ObjectPredicate): void
}

class DataTreeInternal implements DataTree {
  tree: TreeModel
  root: TreeNode

  public constructor() {
    this.tree = new TreeModel()
    this.root = this.tree.parse({ id: 'MOTHERSHIP' })
  }
  public findAll(predicate: ObjectPredicate): SpeckleObject[] {
    return this.root
      .all((node: TreeNode) => {
        if (!node.model.data) return false
        return predicate(node.model.data)
      })
      .map((value: TreeNode) => value.model.data)
  }

  public findFirst(predicate: ObjectPredicate): SpeckleObject {
    return this.root.first((node: TreeNode) => {
      if (!node.model.data) return false
      return predicate(node.model.data)
    }).model.data
  }

  public walk(predicate: ObjectPredicate) {
    this.root.walk((node: TreeNode) => {
      if (!node.model.data) return true
      return predicate(node.model.data)
    })
  }
}

export class DataTreeBuilder {
  public static build(root: TreeNode): DataTree {
    const dataTree = new DataTreeInternal()
    let parent = null
    WorldTree.getInstance().walk((node: TreeNode) => {
      if (!node.parent) {
        parent = dataTree.root
        return true
      }

      parent = dataTree.root.first((localNode) => {
        return localNode.model.id === node.parent.model.id
      })

      const _node: TreeNode = WorldTree.getInstance().parse({
        id: node.model.id,
        data: node.model.raw,
        atomic: node.model.atomic,
        children: []
      })
      parent.addChild(_node)

      return true
    }, root)
    return dataTree as DataTree
  }
}
