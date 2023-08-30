import { Matrix4 } from 'three'
import { NodeData } from '../../..'
import { GeometryData } from '../../converter/Geometry'
import { GeometryConverter, SpeckleType } from '../GeometryConverter'

export class ObjGeometryConverter extends GeometryConverter {
  public getSpeckleType(node: NodeData): SpeckleType {
    switch (node.raw.type) {
      case 'Group':
        return SpeckleType.BlockInstance
      case 'Mesh':
        return SpeckleType.Mesh
    }
  }

  public convertNodeToGeometryData(node: NodeData): GeometryData {
    const type = this.getSpeckleType(node)
    switch (type) {
      case SpeckleType.BlockInstance:
        return this.BlockInstanceToGeometryData(node)
      case SpeckleType.Mesh:
        return this.MeshToGeometryData(node)
    }
  }

  public disposeNodeGeometryData(node: NodeData): void {
    node
  }

  /** BLOCK INSTANCE */
  private BlockInstanceToGeometryData(node: NodeData): GeometryData {
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
  private MeshToGeometryData(node: NodeData): GeometryData {
    if (!node.raw) return

    const conversionFactor = 1

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
