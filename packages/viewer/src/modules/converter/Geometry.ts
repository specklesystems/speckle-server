/* eslint-disable camelcase */
import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
  InstancedInterleavedBuffer,
  InterleavedBufferAttribute,
  Matrix4,
  Vector2,
  Vector3,
  Vector4
} from 'three'
import { type SpeckleObject } from '../../IViewer.js'
import { getRelativeOffset, makePerspectiveProjection } from '../Helpers.js'
import earcut from 'earcut'

const vecBuff0: Vector3 = new Vector3()
const floatArrayBuff: Float32Array = new Float32Array(16)
Vector3

export enum GeometryAttributes {
  POSITION = 'POSITION',
  COLOR = 'COLOR',
  NORMAL = 'NORMAL',
  UV = 'UV',
  TANGENT = 'TANGENT',
  INDEX = 'INDEX'
}

export interface GeometryData {
  attributes:
    | ({
        [GeometryAttributes.POSITION]: number[]
      } & Partial<
        Record<Exclude<GeometryAttributes, GeometryAttributes.POSITION>, number[]>
      >)
    | null
  bakeTransform: Matrix4 | null
  transform: Matrix4 | null
  metaData?: SpeckleObject
  instanced?: boolean
}

export class Geometry {
  public static updateRTEGeometry(
    geometry: BufferGeometry,
    doublePositions: Float64Array | Float32Array
  ) {
    if (
      geometry.type === 'BufferGeometry' ||
      geometry.type === 'PlaneGeometry' ||
      geometry.type === 'CircleGeometry'
    ) {
      const position_low = new Float32Array(doublePositions.length)
      /** We'll store the high component of the encoding inside three's default `position` attribute */
      const position_high = geometry.attributes.position.array as Float32Array
      Geometry.DoubleToHighLowBuffer(doublePositions, position_low, position_high)
      geometry.setAttribute('position_low', new Float32BufferAttribute(position_low, 3))
    } else if (
      geometry.type === 'LineGeometry' ||
      geometry.type === 'LineSegmentsGeometry'
    ) {
      const position_low = new Float32Array(doublePositions.length)
      /** This is the default instanceStart + instanceEnd interleaved attribute buffer
       *  We're not altering it in reality since the high part of our encoding is the
       *  original position double value casted down to float
       */
      const position_high = geometry.attributes.instanceStart.array as Float32Array

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
    }
  }

  static mergeGeometryAttribute(
    attributes: (number[] | undefined)[],
    target: Float32Array | Float64Array
  ): ArrayLike<number> {
    let offset = 0
    for (let k = 0; k < attributes.length; k++) {
      const attribute = attributes[k]
      if (!attribute || !target) {
        throw new Error('Cannot merge geometries. Indices or positions are undefined')
      }
      target.set(attribute, offset)
      offset += attribute.length
    }
    return target
  }

  static mergeIndexAttribute(
    indexAttributes: (number[] | undefined)[],
    positionAttributes: (number[] | undefined)[]
  ): number[] {
    let indexOffset = 0
    const mergedIndex = []

    for (let i = 0; i < indexAttributes.length; ++i) {
      const index = indexAttributes[i]
      const positions = positionAttributes[i]
      if (!index || !positions) {
        throw new Error('Cannot merge geometries. Indices or positions are undefined')
      }

      for (let j = 0; j < index.length; ++j) {
        mergedIndex.push(index[j] + indexOffset / 3)
      }

      indexOffset += positions.length
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
      /** Catering to typescript */
      if (geometries[i].bakeTransform !== null)
        Geometry.transformGeometryData(geometries[i], geometries[i].bakeTransform)
    }

    if (sampleAttributes && sampleAttributes[GeometryAttributes.INDEX]) {
      const indexAttributes: (number[] | undefined)[] = geometries.map(
        (item: GeometryData) => {
          /** Catering to typescript */
          if (!item.attributes) return
          return item.attributes[GeometryAttributes.INDEX]
        }
      )
      const positionAttributes: (number[] | undefined)[] = geometries.map((item) => {
        /** Catering to typescript */
        if (!item.attributes) return
        return item.attributes[GeometryAttributes.POSITION]
      })
      /** o_0 Catering to typescript*/
      if (mergedGeometry.attributes)
        mergedGeometry.attributes[GeometryAttributes.INDEX] =
          Geometry.mergeIndexAttribute(indexAttributes, positionAttributes)
    }

    for (const k in sampleAttributes) {
      if (k !== GeometryAttributes.INDEX) {
        const attributes: (number[] | undefined)[] = geometries.map((item) => {
          /** Catering to typescript */
          if (!item.attributes) return
          return item.attributes[k as GeometryAttributes] as number[]
        })
        /** Catering to typescript */
        if (mergedGeometry.attributes)
          mergedGeometry.attributes[k as GeometryAttributes] =
            Geometry.mergeGeometryAttribute(
              attributes,
              k === GeometryAttributes.POSITION
                ? new Float64Array(
                    attributes.reduce((prev, cur) => {
                      /** Catering to typescript */
                      if (!cur) return 0
                      return prev + cur.length
                    }, 0)
                  )
                : new Float32Array(
                    attributes.reduce((prev, cur) => {
                      /** Catering to typescript */
                      if (!cur) return 0
                      return prev + cur.length
                    }, 0)
                  )
            ) as number[]
      }
    }

    geometries.forEach((geometry) => {
      for (const k in geometry.attributes) {
        delete geometry.attributes[k as GeometryAttributes]
      }
    })

    return mergedGeometry
  }

  public static transformGeometryData(geometryData: GeometryData, m: Matrix4 | null) {
    if (!geometryData.attributes) return
    if (!geometryData.attributes.POSITION) return
    if (!m) return

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

  /** Please see https://speckle.systems/blog/improving-speckles-rte-implementation/ for additional details
   *  regarding double -> <float low; float high> encoding.
   */
  public static DoubleToHighLowVector(input: Vector3, low: Vector3, high: Vector3) {
    let doubleValue = input.x
    if (doubleValue >= 0.0) {
      floatArrayBuff[0] = doubleValue
      const doubleHigh = floatArrayBuff[0]
      high.x = doubleHigh
      low.x = doubleValue - doubleHigh
    } else {
      floatArrayBuff[0] = -doubleValue
      const doubleHigh = floatArrayBuff[0]
      high.x = -doubleHigh
      low.x = doubleValue + doubleHigh
    }
    doubleValue = input.y
    if (doubleValue >= 0.0) {
      floatArrayBuff[0] = doubleValue
      const doubleHigh = floatArrayBuff[0]
      high.y = doubleHigh
      low.y = doubleValue - doubleHigh
    } else {
      floatArrayBuff[0] = -doubleValue
      const doubleHigh = floatArrayBuff[0]
      high.y = -doubleHigh
      low.y = doubleValue + doubleHigh
    }
    doubleValue = input.z
    if (doubleValue >= 0.0) {
      floatArrayBuff[0] = doubleValue
      const doubleHigh = floatArrayBuff[0]
      high.z = doubleHigh
      low.z = doubleValue - doubleHigh
    } else {
      floatArrayBuff[0] = -doubleValue
      const doubleHigh = floatArrayBuff[0]
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
        floatArrayBuff[0] = doubleValue
        const doubleHigh = floatArrayBuff[0]
        position_high[k] = doubleHigh
        position_low[k] = doubleValue - doubleHigh
      } else {
        floatArrayBuff[0] = -doubleValue
        const doubleHigh = floatArrayBuff[0]
        position_high[k] = -doubleHigh
        position_low[k] = doubleValue + doubleHigh
      }
    }
  }

  public static needsRTE(bounds: Box3) {
    const cameraDistance = getRelativeOffset(bounds, 0.01)
    const cameraNear = getRelativeOffset(bounds, 0.009)
    const screenSize = new Vector2(1920, 1080)
    const cameraProjection = makePerspectiveProjection(
      screenSize,
      50,
      cameraNear,
      cameraNear * 10
    )

    const pixelDelta = new Vector2(-1, -1)
    const points = [bounds.min, bounds.max, bounds.getCenter(new Vector3())]
    for (let k = 0; k < points.length; k++) {
      const delta = Geometry.getFP32ProjectionDelta(
        points[k],
        cameraProjection,
        screenSize,
        cameraDistance
      )
      pixelDelta.x = Math.max(pixelDelta.x, delta.x)
      pixelDelta.y = Math.max(pixelDelta.y, delta.y)
    }

    return pixelDelta.x >= 0.5 || pixelDelta.y >= 0.5
  }

  public static getFP32ProjectionDelta(
    point: Vector3,
    projection: Matrix4,
    screenSize: Vector2,
    relativeOffset: number = 1
  ) {
    /** Cast to float, loose precision */
    floatArrayBuff[0] = point.x
    floatArrayBuff[1] = point.y
    floatArrayBuff[2] = point.z

    /** Single precision version */
    const floatVector = vecBuff0.set(
      floatArrayBuff[0],
      floatArrayBuff[1],
      floatArrayBuff[2]
    )

    /** A bit of randomness so camera has a rotation */
    const camPos = new Vector3()
      .copy(point)
      .add(
        new Vector3(
          Math.random() * relativeOffset,
          Math.random() * relativeOffset,
          -relativeOffset
        )
      )
    /** Double precision */
    const viewProjectionFp64 = new Matrix4().lookAt(camPos, point, new Vector3(0, 1, 0))
    viewProjectionFp64.setPosition(camPos)
    viewProjectionFp64.invert()
    viewProjectionFp64.premultiply(projection)
    /** Single precision */
    const viewProjectionFp32 = new Matrix4().copy(viewProjectionFp64)
    viewProjectionFp32.toArray(floatArrayBuff)
    viewProjectionFp32.fromArray(floatArrayBuff)

    /** Project and turn into pixels */
    const float4 = new Vector4(floatVector.x, floatVector.y, floatVector.z, 1)
    const double4 = new Vector4(floatVector.x, floatVector.y, floatVector.z, 1)
    float4.applyMatrix4(viewProjectionFp32)
    float4.multiplyScalar(0.5 / float4.w)
    float4.addScalar(0.5)
    float4.multiply(new Vector4(screenSize.x, screenSize.y, 0, 0))
    double4.applyMatrix4(viewProjectionFp64)
    double4.multiplyScalar(0.5 / double4.w)
    double4.addScalar(0.5)
    double4.multiply(new Vector4(screenSize.x, screenSize.y, 0, 0))

    // console.log('Float -> ', float4)
    // console.log('Double -> ', double4)

    /** Pixel difference */
    return new Vector2(Math.abs(double4.x - float4.x), Math.abs(double4.y - float4.y))
  }

  /** Only supports indexed geometry */
  public static computeVertexNormalsBuffer(
    buffer: number[],
    position: number[],
    index: number[]
  ) {
    const pA = new Vector3(),
      pB = new Vector3(),
      pC = new Vector3()
    const nA = new Vector3(),
      nB = new Vector3(),
      nC = new Vector3()
    const cb = new Vector3(),
      ab = new Vector3()

    // indexed elements
    for (let i = 0, il = index.length; i < il; i += 3) {
      const vA = index[i + 0]
      const vB = index[i + 1]
      const vC = index[i + 2]

      pA.fromArray(position, vA * 3)
      pB.fromArray(position, vB * 3)
      pC.fromArray(position, vC * 3)

      cb.subVectors(pC, pB)
      ab.subVectors(pA, pB)
      cb.cross(ab)

      nA.fromArray(buffer, vA * 3)
      nB.fromArray(buffer, vB * 3)
      nC.fromArray(buffer, vC * 3)

      nA.add(cb)
      nB.add(cb)
      nC.add(cb)

      buffer[vA * 3] = nA.x
      buffer[vA * 3 + 1] = nA.y
      buffer[vA * 3 + 2] = nA.z

      buffer[vB * 3] = nB.x
      buffer[vB * 3 + 1] = nB.y
      buffer[vB * 3 + 2] = nB.z

      buffer[vC * 3] = nC.x
      buffer[vC * 3 + 1] = nC.y
      buffer[vC * 3 + 2] = nC.z
    }
  }

  public static computeVertexNormals(
    buffer: BufferGeometry,
    doublePositions: Float64Array
  ) {
    const index = buffer.index
    const positionAttribute = buffer.getAttribute('position')

    if (positionAttribute !== undefined) {
      let normalAttribute = buffer.getAttribute('normal')

      if (normalAttribute === undefined) {
        normalAttribute = new BufferAttribute(
          new Float32Array(positionAttribute.count * 3),
          3
        )
        buffer.setAttribute('normal', normalAttribute)
      } else {
        // reset existing normals to zero
        for (let i = 0, il = normalAttribute.count; i < il; i++) {
          normalAttribute.setXYZ(i, 0, 0, 0)
        }
      }

      const pA = new Vector3(),
        pB = new Vector3(),
        pC = new Vector3()
      const nA = new Vector3(),
        nB = new Vector3(),
        nC = new Vector3()
      const cb = new Vector3(),
        ab = new Vector3()

      // indexed elements
      if (index) {
        for (let i = 0, il = index.count; i < il; i += 3) {
          const vA = index.getX(i + 0)
          const vB = index.getX(i + 1)
          const vC = index.getX(i + 2)

          pA.fromArray(doublePositions, vA * 3)
          pB.fromArray(doublePositions, vB * 3)
          pC.fromArray(doublePositions, vC * 3)

          cb.subVectors(pC, pB)
          ab.subVectors(pA, pB)
          cb.cross(ab)

          nA.fromBufferAttribute(normalAttribute, vA)
          nB.fromBufferAttribute(normalAttribute, vB)
          nC.fromBufferAttribute(normalAttribute, vC)

          nA.add(cb)
          nB.add(cb)
          nC.add(cb)

          normalAttribute.setXYZ(vA, nA.x, nA.y, nA.z)
          normalAttribute.setXYZ(vB, nB.x, nB.y, nB.z)
          normalAttribute.setXYZ(vC, nC.x, nC.y, nC.z)
        }
      } else {
        // non-indexed elements (unconnected triangle soup)

        for (let i = 0, il = positionAttribute.count; i < il; i += 3) {
          /** This is done blind. Don't think speckle supports non-indexed geometry */
          pA.fromArray(doublePositions, i * 3)
          pB.fromArray(doublePositions, i * 3 + 1)
          pC.fromArray(doublePositions, i * 3 + 2)

          cb.subVectors(pC, pB)
          ab.subVectors(pA, pB)
          cb.cross(ab)

          normalAttribute.setXYZ(i + 0, cb.x, cb.y, cb.z)
          normalAttribute.setXYZ(i + 1, cb.x, cb.y, cb.z)
          normalAttribute.setXYZ(i + 2, cb.x, cb.y, cb.z)
        }
      }

      buffer.normalizeNormals()

      normalAttribute.needsUpdate = true
    }
  }

  public static triangulatePolygon(points: Vector2[]): number[] {
    const flatArray = new Array<number>(points.length * 2)
    points.forEach((point: Vector2, index) => point.toArray(flatArray, index * 2))

    return earcut(flatArray)
  }
}
