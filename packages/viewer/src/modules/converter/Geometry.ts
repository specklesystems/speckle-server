import {
  BoxBufferGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  Matrix4,
  Uint16BufferAttribute,
  Uint32BufferAttribute
} from 'three'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'

export const GEOMETRY_LINES_AS_TRIANGLES = true
export enum GeometryAttributes {
  POSITION = 'POSITION',
  COLOR = 'COLOR',
  NORMAL = 'NORMAL',
  UV = 'UV',
  TANGENTS = 'TANGENTS',
  INDEX = 'INDEX'
}

export interface GeometryData {
  attributes: Partial<Record<GeometryAttributes, number[]>>
  bakeTransform: Matrix4
  transform: Matrix4
}

/**
 * Implementation here will change once we start working on proper batching
 */
export class Geometry {
  static makePointGeometry(geometryData: GeometryData): BufferGeometry {
    return Geometry.makeMeshGeometry(geometryData)
  }
  static makePointCloudGeometry(geometryData: GeometryData): BufferGeometry {
    return Geometry.makeMeshGeometry(geometryData)
  }
  static makeMeshGeometry(geometryData: GeometryData): BufferGeometry {
    if (geometryData.bakeTransform) {
      Geometry.transformGeometryData(geometryData, geometryData.bakeTransform)
    }
    const buffer = new BufferGeometry()

    if (geometryData.attributes.INDEX) {
      if (
        geometryData.attributes.POSITION.length >= 65535 ||
        geometryData.attributes.INDEX.length >= 65535
      ) {
        buffer.setIndex(new Uint32BufferAttribute(geometryData.attributes.INDEX, 1))
      } else {
        buffer.setIndex(new Uint16BufferAttribute(geometryData.attributes.INDEX, 1))
      }
    }

    if (geometryData.attributes.POSITION) {
      buffer.setAttribute(
        'position',
        new Float32BufferAttribute(geometryData.attributes.POSITION, 3)
      )
    }

    if (geometryData.attributes.COLOR) {
      buffer.setAttribute(
        'color',
        new Float32BufferAttribute(geometryData.attributes.COLOR, 3)
      )
    }

    buffer.computeVertexNormals()
    buffer.computeBoundingSphere()

    return buffer
  }

  static makeLineGeometry(geometryData: GeometryData) {
    if (geometryData.bakeTransform) {
      Geometry.transformGeometryData(geometryData, geometryData.bakeTransform)
    }
    if (GEOMETRY_LINES_AS_TRIANGLES) {
      return this.makeLineGeometry_TRIANGLE(geometryData)
    } else {
      return this.makeLineGeometry_LINE(geometryData)
    }
  }

  static makeLineGeometry_LINE(geometryData: GeometryData) {
    const buffer = new BufferGeometry()
    if (geometryData.attributes.POSITION) {
      buffer.setAttribute(
        'position',
        new Float32BufferAttribute(geometryData.attributes.POSITION, 3)
      )

      if (geometryData.bakeTransform) {
        buffer.attributes.position.applyMatrix4(geometryData.bakeTransform)
      }
    }
    return buffer
  }

  static makeLineGeometry_TRIANGLE(geometryData: GeometryData) {
    const geometry = new LineGeometry()
    geometry.setPositions(geometryData.attributes.POSITION)
    if (geometryData.attributes.COLOR) geometry.setColors(geometryData.attributes.COLOR)
    return geometry
  }

  static mergeGeometryAttribute(
    attributes: number[][],
    target: Float32Array
  ): ArrayLike<number> {
    let arrayLength = 0
    for (let k = 0; k < attributes.length; k++) {
      arrayLength += attributes[k].length
    }
    let offset = 0
    for (let k = 0; k < attributes.length; k++) {
      target.set(attributes[k], offset)
      offset += attributes[k].length
    }
    return target
  }

  static mergeIndexAttribute(
    indexAttributes: number[][],
    positionAttributes: number[][]
  ): number[] {
    let indexOffset = 0
    const mergedIndex = []

    for (let i = 0; i < indexAttributes.length; ++i) {
      const index = indexAttributes[i]

      for (let j = 0; j < index.length; ++j) {
        mergedIndex.push(index[j] + indexOffset)
      }

      indexOffset += positionAttributes.length
    }
    return mergedIndex
  }

  static mergeGeometryData(geometries: GeometryData[]): GeometryData {
    const sampleAttributes = geometries[0].attributes
    const mergedGeometry = {
      attributes: {},
      bakeTransform: null,
      transform: null
    } as GeometryData

    for (let i = 0; i < geometries.length; i++) {
      Geometry.transformGeometryData(geometries[i], geometries[i].bakeTransform)
    }

    if (sampleAttributes[GeometryAttributes.INDEX]) {
      const indexAttributes = geometries.map(
        (item) => item.attributes[GeometryAttributes.INDEX]
      )
      const positionAttributes = geometries.map(
        (item) => item.attributes[GeometryAttributes.POSITION]
      )
      mergedGeometry.attributes[GeometryAttributes.INDEX] =
        Geometry.mergeIndexAttribute(indexAttributes, positionAttributes)
    }

    for (let k in sampleAttributes) {
      if (k != GeometryAttributes.INDEX) {
        const attributes = geometries.map((item) => {
          return item.attributes[k]
        })
        mergedGeometry.attributes[k] = Geometry.mergeGeometryAttribute(
          attributes,
          new Float32Array(attributes.reduce((prev, cur) => prev + cur.length, 0))
        )
      }
    }

    geometries.forEach((geometry) => {
      for (let k in geometry.attributes) {
        delete geometry.attributes[k]
      }
    })

    return mergedGeometry
  }

  public static transformGeometryData(geometryData: GeometryData, m: Matrix4) {
    if (!geometryData.attributes.POSITION) return

    const e = m.elements

    for (var k = 0; k < geometryData.attributes.POSITION.length; k += 3) {
      const x = geometryData.attributes.POSITION[k],
        y = geometryData.attributes.POSITION[k + 1],
        z = geometryData.attributes.POSITION[k + 2]
      const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15])

      geometryData.attributes.POSITION[k] = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w
      geometryData.attributes.POSITION[k + 1] =
        (e[1] * x + e[5] * y + e[9] * z + e[13]) * w
      geometryData.attributes.POSITION[k + 2] =
        (e[2] * x + e[6] * y + e[10] * z + e[14]) * w
    }
  }

  public static unpackColors(int32Colors: number[]): number[] {
    const colors = new Array<number>(int32Colors.length * 3)
    for (let i = 0; i < int32Colors.length; i++) {
      const color = int32Colors[i]
      const r = (color >> 16) & 0xff
      const g = (color >> 8) & 0xff
      const b = color & 0xff
      colors[i * 3] = r / 255
      colors[i * 3 + 1] = g / 255
      colors[i * 3 + 2] = b / 255
    }
    return colors
  }
}
