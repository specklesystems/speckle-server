import { Mesh, Object3D } from 'three'
import { type TreeNode, WorldTree } from '../../tree/WorldTree.js'
import type { ConverterResultDelegate } from '../Speckle/SpeckleConverter.js'
import Logger from '../../utils/Logger.js'

export type ObjConverterNodeDelegate =
  | ((object: Object3D, node: TreeNode) => Promise<void>)
  | null

export class ObjConverter {
  protected lastAsyncPause: number = 0
  protected tree: WorldTree

  protected readonly NodeConverterMapping: {
    [name: string]: ObjConverterNodeDelegate
  } = {
    Group: this.groupToNode.bind(this),
    Mesh: this.MeshToNode.bind(this)
  }

  public constructor(tree: WorldTree) {
    this.tree = tree
  }

  public async asyncPause() {
    // Don't freeze the UI when doing all those traversals
    if (Date.now() - this.lastAsyncPause >= 100) {
      this.lastAsyncPause = Date.now()
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  public async traverse(
    objectURL: string,
    object: Object3D,
    callback: ConverterResultDelegate,
    node: TreeNode | null = null
  ) {
    await this.asyncPause()

    const childNode: TreeNode = this.tree.parse({
      id: !node ? objectURL : object.uuid,
      raw: object,
      atomic: true,
      children: []
    })

    if (!node) {
      this.tree.addSubtree(childNode)
    } else {
      this.tree.addNode(childNode, node)
    }

    const type = object.type

    if (this.directNodeConverterExists(object)) {
      try {
        await this.convertToNode(object, childNode)
        await callback()
      } catch (e) {
        Logger.warn(
          `(Traversing - direct) Failed to convert ${type} with id: ${object.uuid}`,
          e
        )
      }
    }
    for (let k = 0; k < object.children.length; k++) {
      void this.traverse(objectURL, object.children[k], callback, childNode)
    }
  }

  private directNodeConverterExists(obj: Object3D) {
    return obj.type in this.NodeConverterMapping
  }

  private async convertToNode(obj: Object3D, node: TreeNode) {
    try {
      if (this.directNodeConverterExists(obj)) {
        const delegate = this.NodeConverterMapping[obj.type]
        if (delegate) return await delegate(obj, node)
      }
      return null
    } catch (e) {
      Logger.warn(`(Direct convert) Failed to convert object with id: ${obj.id}`)
      throw e
    }
  }

  private async MeshToNode(_obj: Object3D, node: TreeNode) {
    const obj = _obj as Mesh
    if (!obj) return
    if (
      !obj.geometry.attributes.position ||
      obj.geometry.attributes.position.array.length === 0
    ) {
      Logger.warn(
        `Object id ${obj.id} of type ${obj.type} has no vertex position data and will be ignored`
      )
      return
    }

    node.model.raw.vertices = obj.geometry.attributes.position.array
    node.model.raw.faces = obj.geometry.index?.array
    node.model.raw.colors = obj.geometry.attributes.color?.array
    return Promise.resolve()
  }

  private groupToNode(obj: Object3D, node: TreeNode) {
    obj
    node
    return Promise.resolve()
  }
}
