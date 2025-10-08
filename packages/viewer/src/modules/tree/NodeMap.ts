import Logger from '../utils/Logger.js'
import { type TreeNode } from './WorldTree.js'

export class NodeMap {
  public static readonly COMPOUND_ID_CHAR = '~'
  public static readonly DUPLICATE_ID_CHAR = '#'

  private all: { [id: string]: TreeNode } = {}
  public instances: { [id: string]: { [id: string]: TreeNode } } = {}
  public duplicates: { [id: string]: { [id: string]: TreeNode } } = {}

  public get nodeCount() {
    return Object.keys(this.all).length
  }

  public constructor(subtreeRoot: TreeNode) {
    this.registerNode(subtreeRoot)
  }

  public addNode(node: TreeNode): boolean {
    if (node.model.id.includes(NodeMap.COMPOUND_ID_CHAR)) {
      this.registerInstance(node)
    } else {
      if (this.all[node.model.id]) {
        // console.warn(`Duplicate id ${node.model.id}, skipping!`)
        return false
      }

      this.registerNode(node)

      if (node.model.id.includes(NodeMap.DUPLICATE_ID_CHAR)) {
        this.registerDuplicate(node)
      }
    }
    return true
  }

  public removeNode(node: TreeNode): boolean {
    if (node.model.id.includes(NodeMap.COMPOUND_ID_CHAR)) {
      const baseId = node.model.id.substring(
        0,
        node.model.id.indexOf(NodeMap.COMPOUND_ID_CHAR)
      )
      delete this.instances[baseId][node.model.id]
    } else {
      delete this.all[node.model.id]
    }
    return true
  }

  public getNodeById(id: string): TreeNode[] | null {
    if (id.includes(NodeMap.COMPOUND_ID_CHAR)) {
      const baseId = id.substring(0, id.indexOf(NodeMap.COMPOUND_ID_CHAR))
      if (this.instances[baseId]) {
        if (this.instances[baseId][id]) {
          return [this.instances[baseId][id]]
        }
      } else {
        Logger.warn('Could not find instance with baseID: ', baseId)
        return null
      }
    }
    if (id.includes(NodeMap.DUPLICATE_ID_CHAR)) {
      const baseId = id.substring(0, id.indexOf(NodeMap.DUPLICATE_ID_CHAR))
      if (this.duplicates[baseId]) {
        if (this.duplicates[baseId][id]) {
          return [this.duplicates[baseId][id]]
        }
      } else {
        Logger.warn('Could not find duplicate with baseID: ', baseId)
        return null
      }
    }

    if (this.all[id]) {
      if (this.duplicates[id]) {
        return [this.all[id], ...Object.values(this.duplicates[id])]
      }
      return [this.all[id]]
    }
    if (this.instances[id]) {
      return Object.values(this.instances[id])
    }

    return null
  }

  public getSubtreeById(id: string): TreeNode {
    return this.all[id]
  }

  public hasId(id: string): boolean {
    return this.hasNodeId(id) || this.hasInstanceId(id)
  }

  public hasNodeId(id: string): boolean {
    return this.all[id] !== undefined
  }

  public hasInstanceId(id: string): boolean {
    if (id.includes(NodeMap.COMPOUND_ID_CHAR)) {
      const baseId = id.substring(0, id.indexOf(NodeMap.COMPOUND_ID_CHAR))
      if (this.instances[baseId]) {
        return true
      } else {
        return false
      }
    }
    return false
  }

  private registerInstance(node: TreeNode): void {
    const baseId = node.model.id.substring(
      0,
      node.model.id.indexOf(NodeMap.COMPOUND_ID_CHAR)
    )
    if (!this.instances[baseId]) {
      this.instances[baseId] = {}
    }
    this.instances[baseId][node.model.id] = node
  }

  private registerDuplicate(node: TreeNode): void {
    const baseId = node.model.id.substring(
      0,
      node.model.id.indexOf(NodeMap.DUPLICATE_ID_CHAR)
    )
    if (!this.duplicates[baseId]) {
      this.duplicates[baseId] = {}
    }
    this.duplicates[baseId][node.model.id] = node
  }

  private registerNode(node: TreeNode) {
    this.all[node.model.id] = node
  }

  public purge() {
    this.all = {}
    this.instances = {}
  }
}
