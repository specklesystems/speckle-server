import Logger from 'js-logger'
import { TreeNode } from './WorldTree'

export class NodeMap {
  public static readonly COMPOUND_ID_CHAR = '.'

  private all: { [id: string]: TreeNode } = {}
  private instances: { [id: string]: { [id: string]: TreeNode } } = {}

  public get nodeCount() {
    return Object.keys(this.all).length
  }

  public addSubtree(node: TreeNode) {
    if (this.all[node.model.id]) {
      console.error('Whoa, duplicate id! ', node)
    }
    this.registerNode(node)
  }

  public addNode(node: TreeNode) {
    if (this.all[node.model.id]) {
      console.error('Whoa, duplicate id! ', node)
    }
    if (node.model.id.includes(NodeMap.COMPOUND_ID_CHAR)) {
      this.registerInstance(node)
    } else this.registerNode(node)
  }

  public getNodeById(id: string): TreeNode | TreeNode[] {
    if (id.includes(NodeMap.COMPOUND_ID_CHAR)) {
      const baseId = id.substring(0, id.indexOf(NodeMap.COMPOUND_ID_CHAR))
      if (this.instances[baseId]) {
        return this.instances[baseId][id]
      } else {
        Logger.error('Whoa, could not find instance with baseID: ', baseId)
        return null
      }
    }
    if (this.all[id]) {
      return this.all[id]
    }
    if (this.instances[id]) {
      return Object.values(this.instances[id])
    }
  }

  public hasId(id: string) {
    if (id.includes(NodeMap.COMPOUND_ID_CHAR)) {
      const baseId = id.substring(0, id.indexOf(NodeMap.COMPOUND_ID_CHAR))
      if (this.instances[baseId]) {
        return true
      } else {
        return false
      }
    }
    if (this.all[id]) {
      return true
    }
    if (this.instances[id]) {
      return true
    }
  }

  private registerInstance(node: TreeNode) {
    const baseId = node.model.id.substring(
      0,
      node.model.id.indexOf(NodeMap.COMPOUND_ID_CHAR)
    )
    if (!this.instances[baseId]) {
      this.instances[baseId] = {}
    }
    this.instances[baseId][node.model.id] = node
  }

  private registerNode(node: TreeNode) {
    this.all[node.model.id] = node
  }

  public removeNode(node: TreeNode) {
    delete this.all[node.id]
  }
}
