/* eslint-disable camelcase */
import {
  BufferGeometry,
  Float32BufferAttribute,
  InstancedInterleavedBuffer,
  InterleavedBufferAttribute,
  Matrix4,
  Vector3
} from 'three'

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

export class Geometry {
  public static updateRTEGeometry(
    geometry: BufferGeometry,
    doublePositions: Float64Array
  ) {
    if (geometry.type === 'BufferGeometry') {
      const position_low = new Float32Array(doublePositions.length)
      const position_high = new Float32Array(doublePositions.length)
      Geometry.DoubleToHighLowBuffer(doublePositions, position_low, position_high)
      geometry.setAttribute('position_low', new Float32BufferAttribute(position_low, 3))
      geometry.setAttribute(
        'position_high',
        new Float32BufferAttribute(position_high, 3)
      )
    } else if (
      geometry.type === 'LineGeometry' ||
      geometry.type === 'LineSegmentsGeometry'
    ) {
      const position_low = new Float32Array(doublePositions.length)
      const position_high = new Float32Array(doublePositions.length)

      Geometry.DoubleToHighLowBuffer(doublePositions, position_low, position_high)

      const instanceBufferLow = new InstancedInterleavedBuffer(
        new Float32Array(position_low),
        6,
        1
      ) // xyz, xyz
      geometry.setAttribute(
        'instanceStartLow',
        new InterleavedBufferAttribute(instanceBufferLow, 3, 0)
      ) // xyz
      geometry.setAttribute(
        'instanceEndLow',
        new InterleavedBufferAttribute(instanceBufferLow, 3, 3)
      ) // xyz

      const instanceBufferHigh = new InstancedInterleavedBuffer(
        new Float32Array(position_high),
        6,
        1
      ) // xyz, xyz
      geometry.setAttribute(
        'instanceStartHigh',
        new InterleavedBufferAttribute(instanceBufferHigh, 3, 0)
      ) // xyz
      geometry.setAttribute(
        'instanceEndHigh',
        new InterleavedBufferAttribute(instanceBufferHigh, 3, 3)
      ) // xyz
    }
  }

  static mergeGeometryAttribute(
    attributes: number[][],
    target: Float32Array | Float64Array
  ): ArrayLike<number> {
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
      if (geometries[i].bakeTransform)
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

    for (const k in sampleAttributes) {
      if (k !== GeometryAttributes.INDEX) {
        const attributes = geometries.map((item) => {
          return item.attributes[k]
        })
        mergedGeometry.attributes[k] = Geometry.mergeGeometryAttribute(
          attributes,
          k === GeometryAttributes.POSITION
            ? new Float64Array(attributes.reduce((prev, cur) => prev + cur.length, 0))
            : new Float32Array(attributes.reduce((prev, cur) => prev + cur.length, 0))
        )
      }
    }

    geometries.forEach((geometry) => {
      for (const k in geometry.attributes) {
        delete geometry.attributes[k]
      }
    })

    return mergedGeometry
  }

  public static transformGeometryData(geometryData: GeometryData, m: Matrix4) {
    if (!geometryData.attributes.POSITION) return

    const e = m.elements

    for (let k = 0; k < geometryData.attributes.POSITION.length; k += 3) {
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

  public static DoubleToHighLowVector(input: Vector3, low: Vector3, high: Vector3) {
    let doubleValue = input.x
    if (doubleValue >= 0.0) {
      const doubleHigh = Math.floor(doubleValue / 65536.0) * 65536.0
      high.x = doubleHigh
      low.x = doubleValue - doubleHigh
    } else {
      const doubleHigh = Math.floor(-doubleValue / 65536.0) * 65536.0
      high.x = -doubleHigh
      low.x = doubleValue + doubleHigh
    }
    doubleValue = input.y
    if (doubleValue >= 0.0) {
      const doubleHigh = Math.floor(doubleValue / 65536.0) * 65536.0
      high.y = doubleHigh
      low.y = doubleValue - doubleHigh
    } else {
      const doubleHigh = Math.floor(-doubleValue / 65536.0) * 65536.0
      high.y = -doubleHigh
      low.y = doubleValue + doubleHigh
    }
    doubleValue = input.z
    if (doubleValue >= 0.0) {
      const doubleHigh = Math.floor(doubleValue / 65536.0) * 65536.0
      high.z = doubleHigh
      low.z = doubleValue - doubleHigh
    } else {
      const doubleHigh = Math.floor(-doubleValue / 65536.0) * 65536.0
      high.z = -doubleHigh
      low.z = doubleValue + doubleHigh
    }
  }

  public static DoubleToHighLowBuffer(
    input: ArrayLike<number>,
    position_low: number[] | Float32Array,
    position_high: number[] | Float32Array
  ) {
    for (let k = 0; k < input.length; k++) {
      const doubleValue = input[k]
      if (doubleValue >= 0.0) {
        const doubleHigh = Math.floor(doubleValue / 65536.0) * 65536.0
        position_high[k] = doubleHigh
        position_low[k] = doubleValue - doubleHigh
      } else {
        const doubleHigh = Math.floor(-doubleValue / 65536.0) * 65536.0
        position_high[k] = -doubleHigh
        position_low[k] = doubleValue + doubleHigh
      }
    }
  }
}
