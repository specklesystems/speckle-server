import TreeModel from 'tree-model'
import { TreeNode, WorldTree } from './WorldTree'

export type SpeckleObject = Record<string, unknown>
export type ObjectPredicate = (guid: string, obj: SpeckleObject) => boolean

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
    this.root = this.tree.parse({ guid: WorldTree.ROOT_ID })
  }
  public findAll(predicate: ObjectPredicate): SpeckleObject[] {
    return this.root
      .all((node: TreeNode) => {
        if (!node.model.data) return false
        return predicate(node.model.guid, node.model.data)
      })
      .map((value: TreeNode) => value.model.data)
  }

  public findFirst(predicate: ObjectPredicate): SpeckleObject {
    return this.root.first((node: TreeNode) => {
      if (!node.model.data) return false
      return predicate(node.model.guid, node.model.data)
    }).model.data
  }

  public walk(predicate: ObjectPredicate) {
    this.root.walk((node: TreeNode) => {
      if (!node.model.data) return true
      return predicate(node.model.guid, node.model.data)
    })
  }
}

export class DataTreeBuilder {
  public static build(tree: WorldTree): DataTree {
    const dataTree = new DataTreeInternal()
    let parent = null
    tree.root.walk((node: TreeNode) => {
      if (!node.parent) {
        parent = dataTree.root
        return true
      }

      parent = dataTree.root.first((localNode) => {
        return localNode.model.guid === node.parent.model.id
      })

      const _node: TreeNode = tree.parse({
        guid: node.model.id,
        data: node.model.raw,
        atomic: node.model.atomic,
        children: []
      })
      parent.addChild(_node)

      return true
    }, tree.root)
    return dataTree as DataTree
  }
}
