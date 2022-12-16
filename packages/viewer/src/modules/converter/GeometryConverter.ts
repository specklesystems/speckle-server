import { BoxBufferGeometry, EllipseCurve, Matrix4, Vector2, Vector3 } from 'three'
import { Geometry, GeometryData } from './Geometry'
import MeshTriangulationHelper from './MeshTriangulationHelper'
import { getConversionFactor } from './Units'
import { NodeData } from '../tree/WorldTree'
import Logger from 'js-logger'

export enum SpeckleType {
  View3D = 'View3D',
  BlockInstance = 'BlockInstance',
  Pointcloud = 'Pointcloud',
  Brep = 'Brep',
  Mesh = 'Mesh',
  Point = 'Point',
  Line = 'Line',
  Polyline = 'Polyline',
  Box = 'Box',
  Polycurve = 'Polycurve',
  Curve = 'Curve',
  Circle = 'Circle',
  Arc = 'Arc',
  Ellipse = 'Ellipse',
  Unknown = 'Unknown'
}

export class GeometryConverter {
  public static getSpeckleType(node: NodeData): SpeckleType {
    let type = 'Base'
    if (node.raw.data)
      type = node.raw.data.speckle_type
        ? node.raw.data.speckle_type.split('.').reverse()[0]
        : type
    else
      type = node.raw.speckle_type
        ? node.raw.speckle_type.split('.').reverse()[0]
        : type
    if (type in SpeckleType) return type as SpeckleType
    else return SpeckleType.Unknown
  }

  public static convertNodeToGeometryData(node: NodeData): GeometryData {
    const type = GeometryConverter.getSpeckleType(node)
    switch (type) {
      case SpeckleType.BlockInstance:
        return GeometryConverter.BlockInstanceToGeometryData(node)
      case SpeckleType.Pointcloud:
        return GeometryConverter.PointcloudToGeometryData(node)
      case SpeckleType.Brep:
        return GeometryConverter.BrepToGeometryData(node)
      case SpeckleType.Mesh:
        return GeometryConverter.MeshToGeometryData(node)
      case SpeckleType.Point:
        return GeometryConverter.PointToGeometryData(node)
      case SpeckleType.Line:
        return GeometryConverter.LineToGeometryData(node)
      case SpeckleType.Polyline:
        return GeometryConverter.PolylineToGeometryData(node)
      case SpeckleType.Box:
        return GeometryConverter.BoxToGeometryData(node)
      case SpeckleType.Polycurve:
        return GeometryConverter.PolycurveToGeometryData(node)
      case SpeckleType.Curve:
        return GeometryConverter.CurveToGeometryData(node)
      case SpeckleType.Circle:
        return GeometryConverter.CircleToGeometryData(node)
      case SpeckleType.Arc:
        return GeometryConverter.ArcToGeometryData(node)
      case SpeckleType.Ellipse:
        return GeometryConverter.EllipseToGeometryData(node)
      case SpeckleType.View3D:
        return GeometryConverter.View3DToGeometryData(node)
      default:
        // console.warn(`Skipping geometry conversion for ${type}`)
        return null
    }
  }
  static View3DToGeometryData(node: NodeData): GeometryData {
    const vOrigin = GeometryConverter.PointToVector3(node.raw.origin)
    const vTarget = GeometryConverter.PointToVector3(node.raw.target)
    node.raw.origin = vOrigin
    node.raw.target = vTarget

    return {
      attributes: null,
      bakeTransform: null,
      transform: null
    } as GeometryData
  }

  /** BLOCK INSTANCE */
  private static BlockInstanceToGeometryData(node: NodeData): GeometryData {
    const conversionFactor = getConversionFactor(node.raw.units)
    /**
     * Speckle matrices are row major. Three's 'fromArray' function assumes
     * the matrix is in column major. That's why we transpose it here.
     */
    const matrixData: number[] = Array.isArray(node.raw.transform)
      ? node.raw.transform
      : node.raw.transform.value
    const matrix = new Matrix4().fromArray(matrixData).transpose()
    /** We need to scale the transform, but not propagate the scale towards the block's children
     *  They do the scaling on their own. That's why we multiply with the inverse scale at the end
     *  Not 100% sure on this if the original block matrix containts it's own scale + rotation
     */
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
   * POINT CLOUD
   */
  private static PointcloudToGeometryData(node: NodeData) {
    const conversionFactor = getConversionFactor(node.raw.units)

    const vertices = node.raw.points
    const colorsRaw = node.raw.colors
    let colors = null

    if (colorsRaw && colorsRaw.length !== 0) {
      if (colorsRaw.length !== vertices.length / 3) {
        Logger.warn(
          `Mesh (id ${node.raw.id}) colours are mismatched with vertice counts. The number of colours must equal the number of vertices.`
        )
      }
      /** We want the colors in linear space */
      colors = GeometryConverter.unpackColors(colorsRaw, true)
    }
    return {
      attributes: {
        POSITION: vertices,
        COLOR: colors
      },
      bakeTransform: new Matrix4().makeScale(
        conversionFactor,
        conversionFactor,
        conversionFactor
      ),
      transform: null
    } as GeometryData
  }

  /**
   * BREP
   */
  private static BrepToGeometryData(node) {
    /** Breps don't (currently) have inherent geometryic description in the viewer. They are replaced
     * by their mesh display values
     */
    node
    return null
  }

  /**
   * MESH
   */
  private static MeshToGeometryData(node: NodeData): GeometryData {
    if (!node.raw) return

    const conversionFactor = getConversionFactor(node.raw.units)
    // const buffer = new BufferGeometry()
    const indices = []

    if (!node.raw.vertices) return
    if (!node.raw.faces) return

    const vertices = node.raw.vertices
    const faces = node.raw.faces
    const colorsRaw = node.raw.colors
    let colors = null

    let k = 0
    while (k < faces.length) {
      let n = faces[k]
      if (n < 3) n += 3 // 0 -> 3, 1 -> 4

      if (n === 3) {
        // Triangle face
        indices.push(faces[k + 1], faces[k + 2], faces[k + 3])
      } else {
        // Quad or N-gon face
        const triangulation = MeshTriangulationHelper.triangulateFace(
          k,
          faces,
          vertices
        )
        indices.push(
          ...triangulation.filter((el) => {
            return el !== undefined
          })
        )
      }

      k += n + 1
    }

    if (colorsRaw && colorsRaw.length !== 0) {
      if (colorsRaw.length !== vertices.length / 3) {
        Logger.warn(
          `Mesh (id ${node.raw.id}) colours are mismatched with vertice counts. The number of colours must equal the number of vertices.`
        )
      }
      colors = GeometryConverter.unpackColors(colorsRaw)
    }

    return {
      attributes: {
        POSITION: vertices,
        INDEX: indices,
        COLOR: colors
      },
      bakeTransform: new Matrix4().makeScale(
        conversionFactor,
        conversionFactor,
        conversionFactor
      ),
      transform: null
    } as GeometryData
  }

  /**
   * POINT
   */
  private static PointToGeometryData(node: NodeData): GeometryData {
    const conversionFactor = getConversionFactor(node.raw.units)
    return {
      attributes: {
        POSITION: this.PointToFloatArray(node.raw)
      },
      bakeTransform: new Matrix4().makeScale(
        conversionFactor,
        conversionFactor,
        conversionFactor
      ),
      transform: null
    } as GeometryData
  }

  /**
   * LINE
   */
  private static LineToGeometryData(node: NodeData): GeometryData {
    const conversionFactor = getConversionFactor(node.raw.units)
    return {
      attributes: {
        POSITION: this.PointToFloatArray(node.raw.start).concat(
          this.PointToFloatArray(node.raw.end)
        )
      },
      bakeTransform: new Matrix4().makeScale(
        conversionFactor,
        conversionFactor,
        conversionFactor
      ),
      transform: null
    } as GeometryData
  }

  /**
   * POLYLINE
   */
  private static PolylineToGeometryData(node: NodeData): GeometryData {
    const conversionFactor = getConversionFactor(node.raw.units)

    if (node.raw.closed)
      node.raw.value.push(node.raw.value[0], node.raw.value[1], node.raw.value[2])
    return {
      attributes: {
        POSITION: node.raw.value.slice(0)
      },
      bakeTransform: new Matrix4().makeScale(
        conversionFactor,
        conversionFactor,
        conversionFactor
      ),
      transform: null
    } as GeometryData
  }

  /**
   * BOX
   */
  private static BoxToGeometryData(node: NodeData) {
    /**
     * Right, so we're cheating here a bit. We're using three's box geometry
     * to get the vertices and indices. Normally we could(should) do that by hand
     * but it's too late in the evenning atm...
     */
    const conversionFactor = getConversionFactor(node.raw.units)

    const move = this.PointToVector3(node.raw.basePlane.origin)
    const width = (node.raw.xSize.end - node.raw.xSize.start) * conversionFactor
    const depth = (node.raw.ySize.end - node.raw.ySize.start) * conversionFactor
    const height = (node.raw.zSize.end - node.raw.zSize.start) * conversionFactor

    const box = new BoxBufferGeometry(width, depth, height, 1, 1, 1)
    return {
      attributes: {
        POSITION: box.attributes.position.array,
        INDEX: box.index.array
      },
      bakeTransform: new Matrix4().setPosition(move),
      transform: null
    } as GeometryData
  }

  /**
   * POLYCURVE
   */
  private static PolycurveToGeometryData(node): GeometryData {
    const buffers = []
    for (let i = 0; i < node.children.length; i++) {
      const element = node.children[i]
      const conv = GeometryConverter.convertNodeToGeometryData(element)
      buffers.push(conv)
    }
    return Geometry.mergeGeometryData(buffers)
  }

  /**
   * CURVE
   */
  private static CurveToGeometryData(node) {
    const polylineGeometry = this.PolylineToGeometryData(node.children[0])
    return {
      attributes: {
        POSITION: polylineGeometry.attributes.POSITION
      },
      bakeTransform: polylineGeometry.bakeTransform,
      transform: null
    } as GeometryData
  }

  /**
   * CIRCLE
   */
  private static CircleToGeometryData(node: NodeData) {
    const conversionFactor = getConversionFactor(node.raw.units)
    const curveSegmentLength = 0.1 * conversionFactor
    const points = this.getCircularCurvePoints(
      node.raw.plane,
      node.raw.radius * conversionFactor,
      undefined,
      undefined,
      curveSegmentLength
    )
    return {
      attributes: {
        POSITION: this.FlattenVector3Array(points)
      },
      bakeTransform: null,
      transform: null
    } as GeometryData
  }

  /**
   * ARC
   */
  private static ArcToGeometryData(node: NodeData) {
    const origin = new Vector3(
      node.raw.plane.origin.x,
      node.raw.plane.origin.y,
      node.raw.plane.origin.z
    )
    const startPoint = new Vector3(
      node.raw.startPoint.x,
      node.raw.startPoint.y,
      node.raw.startPoint.z
    )
    const endPoint = new Vector3(
      node.raw.endPoint.x,
      node.raw.endPoint.y,
      node.raw.endPoint.z
    )
    const midPoint = new Vector3(
      node.raw.midPoint.x,
      node.raw.midPoint.y,
      node.raw.midPoint.z
    )

    /** The arc's 'midPoint' is not really a 'mid' point. It's just another point along the arc going from
     *  start point to the end point. We get the arc's winding by using the directions from start and end
     *  towards the mid point
     */
    const dd0 = new Vector3().subVectors(startPoint, midPoint).normalize()
    const dd1 = new Vector3().subVectors(endPoint, midPoint).normalize()
    const _clockwise = dd0.dot(dd1) > 0

    // Here we compute arc's orthonormal basis vectors using the origin and the two end points.
    const v0 = new Vector3().subVectors(startPoint, origin)
    v0.normalize()
    const v1 = new Vector3().subVectors(endPoint, origin)
    v1.normalize()
    const v2 = new Vector3().crossVectors(v0, v1)
    v2.normalize()
    /** When the arc has an angle of PI, the directions from start and end to origin
     *  face away from each other, making the cross product return 0, and we end up
     *  with an incorrect orthonormal basis.
     */
    if (v2.length() === 0) {
      /** We compute the plane normal using the mid point instead of the start point*/
      const vm = new Vector3().subVectors(midPoint, origin)
      vm.normalize()
      v2.copy(new Vector3().crossVectors(v0, vm))
      v2.normalize()
    }
    const v3 = new Vector3().crossVectors(v2, v0)
    v3.normalize()
    /**
     * We clamp the dot value to [-1,1] since that's the domain acos is defined on. Normally dot won't return
     * values outside that interval, but due to floating point precision, you sometimes get -1.0000000004, which
     * makes acos return NaN
     */
    const dot = Math.min(Math.max(v0.dot(v1), -1), 1)
    // This is just the angle between the start and end points. Should be same as obj.angleRadians(or something)
    const angle = Math.acos(dot)
    const radius = node.raw.radius
    // We draw the arc in a local un-rotated coordinate system. We rotate it later on via transformation
    const curve = new EllipseCurve(
      0,
      0, // ax, aY
      radius,
      radius, // xRadius, yRadius
      0,
      angle, // aStartAngle, aEndAngle
      _clockwise, // aClockwise
      0 // aRotation
    )
    // This just samples points along the arc curve
    const points = curve.getPoints(50)

    const matrix = new Matrix4()
    // Scale first, in order for the composition to work correctly
    const conversionFactor = getConversionFactor(node.raw.plane.units)
    // We determine the orientation of the plane using the three basis vectors computed above
    const R = new Matrix4().makeBasis(v0, v3, v2)
    // We translate it to the circle's origin (considering the origin's scaling as aswell )
    const T = new Matrix4().setPosition(origin.multiplyScalar(conversionFactor))

    matrix.multiply(T).multiply(R)

    // if (scale) {
    const S = new Matrix4().scale(
      new Vector3(conversionFactor, conversionFactor, conversionFactor)
    )
    matrix.multiply(S)
    // }

    return {
      attributes: {
        POSITION: this.FlattenVector3Array(points)
      },
      bakeTransform: matrix,
      transform: null
    } as GeometryData
  }

  /**
   * ELLIPSE
   */
  private static EllipseToGeometryData(node: NodeData) {
    const conversionFactor = getConversionFactor(node.raw.units)

    const center = new Vector3(
      node.raw.plane.origin.x,
      node.raw.plane.origin.y,
      node.raw.plane.origin.z
    ).multiplyScalar(conversionFactor)
    const xAxis = new Vector3(
      node.raw.plane.xdir.x,
      node.raw.plane.xdir.y,
      node.raw.plane.xdir.z
    ).normalize()
    const yAxis = new Vector3(
      node.raw.plane.ydir.x,
      node.raw.plane.ydir.y,
      node.raw.plane.ydir.z
    ).normalize()

    let resolution = 2 * Math.PI * node.raw.firstRadius * conversionFactor * 10
    resolution = parseInt(resolution.toString())
    const points = []

    for (let index = 0; index <= resolution; index++) {
      const t = (index * Math.PI * 2) / resolution
      const x = Math.cos(t) * node.raw.firstRadius * conversionFactor
      const y = Math.sin(t) * node.raw.secondRadius * conversionFactor
      const xMove = new Vector3(xAxis.x * x, xAxis.y * x, xAxis.z * x)
      const yMove = new Vector3(yAxis.x * y, yAxis.y * y, yAxis.z * y)

      const pt = new Vector3().addVectors(xMove, yMove).add(center)
      points.push(pt)
    }

    return {
      attributes: {
        POSITION: this.FlattenVector3Array(points)
      },
      bakeTransform: null,
      transform: null
    } as GeometryData
  }

  /**
   * UTILS
   */

  private static getCircularCurvePoints(
    plane,
    radius,
    startAngle = 0,
    endAngle = 2 * Math.PI,
    res = 0.1
  ) {
    // Get alignment vectors
    const center = this.PointToVector3(plane.origin)
    const xAxis = this.PointToVector3(plane.xdir)
    const yAxis = this.PointToVector3(plane.ydir)

    // Make sure plane axis are unit length!!!!
    xAxis.normalize()
    yAxis.normalize()

    // Determine resolution
    let resolution = ((endAngle - startAngle) * radius) / res
    resolution = parseInt(resolution.toString())

    const points = []

    for (let index = 0; index <= resolution; index++) {
      const t = startAngle + (index * (endAngle - startAngle)) / resolution
      const x = Math.cos(t) * radius
      const y = Math.sin(t) * radius
      const xMove = new Vector3(xAxis.x * x, xAxis.y * x, xAxis.z * x)
      const yMove = new Vector3(yAxis.x * y, yAxis.y * y, yAxis.z * y)

      const pt = new Vector3().addVectors(xMove, yMove).add(center)
      points.push(pt)
    }
    return points
  }

  private static PointToVector3(obj, scale = true) {
    const conversionFactor = scale ? getConversionFactor(obj.units) : 1
    let v = null
    if (obj.value) {
      // Old point format based on value list
      v = new Vector3(
        obj.value[0] * conversionFactor,
        obj.value[1] * conversionFactor,
        obj.value[2] * conversionFactor
      )
    } else {
      // New point format based on cartesian coords
      v = new Vector3(
        obj.x * conversionFactor,
        obj.y * conversionFactor,
        obj.z * conversionFactor
      )
    }
    return v
  }

  private static PointToFloatArray(obj) {
    if (obj.value) {
      return [obj.value[0], obj.value[1], obj.value[2]]
    } else {
      return [obj.x, obj.y, obj.z]
    }
  }

  private static FlattenVector3Array(input: Vector3[] | Vector2[]): number[] {
    const output = new Array(input.length * 3)
    const vBuff = []
    for (let k = 0, l = 0; k < input.length; k++, l += 3) {
      input[k].toArray(vBuff)
      output[l] = vBuff[0]
      output[l + 1] = vBuff[1]
      output[l + 2] = vBuff[2] ? vBuff[2] : 0
    }
    return output
  }

  private static unpackColors(int32Colors: number[], tolinear = false): number[] {
    const colors = new Array<number>(int32Colors.length * 3)
    for (let i = 0; i < int32Colors.length; i++) {
      const color = int32Colors[i]
      const r = (color >> 16) & 0xff
      const g = (color >> 8) & 0xff
      const b = color & 0xff
      colors[i * 3] = r / 255
      colors[i * 3 + 1] = g / 255
      colors[i * 3 + 2] = b / 255
      if (tolinear) {
        colors[i * 3] = GeometryConverter.srgbToLinear(colors[i * 3])
        colors[i * 3 + 1] = GeometryConverter.srgbToLinear(colors[i * 3 + 1])
        colors[i * 3 + 2] = GeometryConverter.srgbToLinear(colors[i * 3 + 2])
      }
    }
    return colors
  }

  private static srgbToLinear(x) {
    if (x <= 0) return 0
    else if (x >= 1) return 1
    else if (x < 0.04045) return x / 12.92
    else return Math.pow((x + 0.055) / 1.055, 2.4)
  }
}
