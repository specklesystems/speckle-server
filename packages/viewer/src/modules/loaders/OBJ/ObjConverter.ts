import { Group, Mesh, Object3D } from 'three'
import { TreeNode, WorldTree } from '../../tree/WorldTree'
import {
  ConverterNodeDelegate,
  ConverterResultDelegate
} from '../Speckle/SpeckleConverter'
import Logger from 'js-logger'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils'

export class ObjConverter {
  private lastAsyncPause: number
  private tree: WorldTree

  private readonly NodeConverterMapping: {
    [name: string]: ConverterNodeDelegate
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
    node: TreeNode = null
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
        await callback(null)
      } catch (e) {
        Logger.warn(
          `(Traversing - direct) Failed to convert ${type} with id: ${object.uuid}`,
          e
        )
      }
    }
    for (let k = 0; k < object.children.length; k++) {
      this.traverse(objectURL, object.children[k], callback, childNode)
    }
  }

  private directNodeConverterExists(obj) {
    return obj.type in this.NodeConverterMapping
  }

  private async convertToNode(obj, node) {
    try {
      if (this.directNodeConverterExists(obj)) {
        return await this.NodeConverterMapping[obj.type](obj, node)
      }
      return null
    } catch (e) {
      Logger.warn(`(Direct convert) Failed to convert object with id: ${obj.id}`)
      throw e
    }
  }

  private async MeshToNode(obj: Mesh, node) {
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
    if (!obj.geometry.index || obj.geometry.index.array.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      obj.geometry = mergeVertices(obj.geometry)
    }

    node.model.raw.vertices = obj.geometry.attributes.position.array
    node.model.raw.faces = obj.geometry.index.array
    node.model.raw.colors = obj.geometry.attributes.color?.array
  }

  private groupToNode(obj: Group, node) {
    obj
    node
  }
}
