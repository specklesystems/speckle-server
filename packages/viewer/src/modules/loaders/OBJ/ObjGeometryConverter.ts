import { Matrix4 } from 'three'
import { type NodeData } from '../../../index.js'
import { type GeometryData } from '../../converter/Geometry.js'
import { GeometryConverter, SpeckleType } from '../GeometryConverter.js'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export class ObjGeometryConverter extends GeometryConverter {
  public getSpeckleType(node: NodeData): SpeckleType {
    switch (node.raw.type) {
      case 'Group':
        return SpeckleType.BlockInstance
      case 'Mesh':
        return SpeckleType.Mesh
      default:
        return SpeckleType.Unknown
    }
  }

  public convertNodeToGeometryData(node: NodeData): GeometryData | null {
    const type = this.getSpeckleType(node)
    switch (type) {
      case SpeckleType.BlockInstance:
        return this.BlockInstanceToGeometryData(node)
      case SpeckleType.Mesh:
        return this.MeshToGeometryData(node)
      default:
        return null
    }
  }

  public disposeNodeGeometryData(node: NodeData): void {
    node
  }

  /** BLOCK INSTANCE */
  protected BlockInstanceToGeometryData(node: NodeData): GeometryData {
    const conversionFactor = 1
    const matrix = new Matrix4().copy(node.raw.matrixWorld)
    const transform: Matrix4 = new Matrix4()
      .makeScale(conversionFactor, conversionFactor, conversionFactor)
      .multiply(matrix)
      .multiply(
        new Matrix4().makeScale(
          1 / conversionFactor,
          1 / conversionFactor,
          1 / conversionFactor
        )
      )

    return {
      attributes: null,
      bakeTransform: null,
      transform
    } as GeometryData
  }

  /**
   * MESH
   */
  protected MeshToGeometryData(node: NodeData): GeometryData | null {
    if (!node.raw) return null

    const conversionFactor = 1
    if (!node.raw.geometry.index || node.raw.geometry.index.array.length === 0) {
      node.raw.geometry = mergeVertices(node.raw.geometry)
    }

    return {
      attributes: {
        POSITION: Array.from(node.raw.geometry.attributes.position.array),
        INDEX: Array.from(node.raw.geometry.index.array),
        ...(node.raw.geometry.attributes.color && {
          COLOR: Array.from(node.raw.geometry.attributes.color.array)
        })
      },
      bakeTransform: new Matrix4().makeScale(
        conversionFactor,
        conversionFactor,
        conversionFactor
      ),
      transform: null
    } as GeometryData
  }
}
