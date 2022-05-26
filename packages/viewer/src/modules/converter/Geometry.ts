/* eslint-disable camelcase */
import {
  Box3,
  BufferGeometry,
  Float32BufferAttribute,
  InstancedInterleavedBuffer,
  InterleavedBufferAttribute,
  Matrix4,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
  Vector3
} from 'three'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import { World } from '../World'
import ObjectWrapper from './ObjectWrapper'

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
  private static _USE_RTE = true
  private static _THICK_LINES = true
  static get USE_RTE(): boolean {
    return Geometry._USE_RTE
  }

  static set USE_RTE(value: boolean) {
    Geometry._USE_RTE = value
    console.warn(`RTE RENDERING IS NOW ${Geometry._USE_RTE}`)
  }

  static get THICK_LINES(): boolean {
    return Geometry._THICK_LINES
  }

  static set THICK_LINES(value: boolean) {
    Geometry._THICK_LINES = value
    console.warn(`THICK_LINES IS NOW ${Geometry._THICK_LINES}`)
  }

  static makePointGeometry(geometryData: GeometryData): BufferGeometry {
    const geometry = Geometry.makeMeshGeometry(geometryData)
    World.expandWorld(geometry.boundingBox)
    return geometry
  }
  static makePointCloudGeometry(geometryData: GeometryData): BufferGeometry {
    const geometry = Geometry.makeMeshGeometry(geometryData)
    World.expandWorld(geometry.boundingBox)
    return geometry
  }
  static makeMeshGeometry(geometryData: GeometryData): BufferGeometry {
    if (geometryData.bakeTransform) {
      Geometry.transformGeometryData(geometryData, geometryData.bakeTransform)
    }
    const geometry = new BufferGeometry()

    if (geometryData.attributes.INDEX) {
      if (
        geometryData.attributes.POSITION.length >= 65535 ||
        geometryData.attributes.INDEX.length >= 65535
      ) {
        geometry.setIndex(new Uint32BufferAttribute(geometryData.attributes.INDEX, 1))
      } else {
        geometry.setIndex(new Uint16BufferAttribute(geometryData.attributes.INDEX, 1))
      }
    }

    if (geometryData.attributes.POSITION) {
      geometry.setAttribute(
        'position',
        new Float32BufferAttribute(geometryData.attributes.POSITION, 3)
      )
    }

    if (geometryData.attributes.COLOR) {
      geometry.setAttribute(
        'color',
        new Float32BufferAttribute(geometryData.attributes.COLOR, 3)
      )
    }

    geometry.computeVertexNormals()
    geometry.computeBoundingSphere()
    geometry.computeBoundingBox()

    World.expandWorld(geometry.boundingBox)

    if (Geometry.USE_RTE) {
      Geometry.updateRTEGeometry(geometry)
    }

    return geometry
  }

  static makeLineGeometry(geometryData: GeometryData) {
    if (geometryData.bakeTransform) {
      Geometry.transformGeometryData(geometryData, geometryData.bakeTransform)
    }
    let geometry: { boundingBox: Box3 }
    if (Geometry.THICK_LINES) {
      geometry = this.makeLineGeometryTriangle(geometryData)
    } else {
      geometry = this.makeLineGeometryLine(geometryData)
    }
    World.expandWorld(geometry.boundingBox)

    return geometry
  }

  static makeLineGeometryLine(geometryData: GeometryData) {
    const geometry = new BufferGeometry()
    if (geometryData.attributes.POSITION) {
      geometry.setAttribute(
        'position',
        new Float32BufferAttribute(geometryData.attributes.POSITION, 3)
      )
    }
    geometry.computeBoundingBox()
    if (Geometry.USE_RTE) {
      Geometry.updateRTEGeometry(geometry)
    }

    return geometry
  }

  static makeLineGeometryTriangle(geometryData: GeometryData) {
    const geometry = new LineGeometry()
    geometry.setPositions(geometryData.attributes.POSITION)
    if (geometryData.attributes.COLOR) geometry.setColors(geometryData.attributes.COLOR)
    geometry.computeBoundingBox()

    if (Geometry.USE_RTE) {
      Geometry.updateRTEGeometry(geometry)
    }
    return geometry
  }

  /**
   *
   * @param geometry TEMPORARY!!!
   */
  public static updateRTEGeometry(geometry: BufferGeometry) {
    if (Geometry.USE_RTE) {
      if (geometry.type === 'BufferGeometry') {
        const position_low = new Float32Array(geometry.attributes.position.array.length)
        const position_high = new Float32Array(
          geometry.attributes.position.array.length
        )
        Geometry.DoubleToHighLowBuffer(
          geometry.attributes.position.array,
          position_low,
          position_high
        )
        geometry.setAttribute(
          'position_low',
          new Float32BufferAttribute(position_low, 3)
        )
        geometry.setAttribute(
          'position_high',
          new Float32BufferAttribute(position_high, 3)
        )
      } else if (geometry.type === 'LineGeometry') {
        const position_low = new Float32Array(
          geometry.attributes.instanceStart.array.length
        )
        const position_high = new Float32Array(
          geometry.attributes.instanceStart.array.length
        )

        Geometry.DoubleToHighLowBuffer(
          geometry.attributes.instanceStart.array,
          position_low,
          position_high
        )

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
  }

  static mergeGeometryAttribute(
    attributes: number[][],
    target: Float32Array
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
          new Float32Array(attributes.reduce((prev, cur) => prev + cur.length, 0))
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

  /**
   *
   * @param wrappers TEMPORARY!!!
   * @returns
   */
  public static applyWorldTransform(wrappers: Array<ObjectWrapper>) {
    const worldCenter = World.worldBox.getCenter(new Vector3())
    worldCenter.negate()
    const transform = new Matrix4().setPosition(worldCenter)
    World.worldBox.makeEmpty()
    for (let k = 0; k < wrappers.length; k++) {
      const wrapper = wrappers[k]
      if (Array.isArray(wrapper.bufferGeometry)) {
        Geometry.applyWorldTransform(wrapper.bufferGeometry)
        return
      }
      try {
        wrapper.bufferGeometry.applyMatrix4(transform)
        wrapper.bufferGeometry.computeBoundingBox()
        World.expandWorld(wrapper.bufferGeometry.boundingBox)
        Geometry.updateRTEGeometry(wrapper.bufferGeometry)
      } catch (e) {
        console.warn(e)
      }
    }
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

  public static InterleaveBuffers(
    input0: number[] | Float32Array,
    input1: number[] | Float32Array
  ) {
    const out = new Array<number>(input0.length + input1.length)
    for (let k = 0, l = 0; k < out.length; k += 6, l += 3) {
      out[k] = input0[k]
      out[k + 1] = input0[k + 1]
      out[k + 2] = input0[k + 2]

      out[k + 3] = input1[k]
      out[k + 4] = input1[k + 1]
      out[k + 5] = input1[k + 2]
    }
    return out
  }
}
