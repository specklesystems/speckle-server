import { Geometry, type GeometryData } from '../../converter/Geometry.js'
import MeshTriangulationHelper from '../../converter/MeshTriangulationHelper.js'
import { getConversionFactor } from '../../converter/Units.js'
import { type NodeData } from '../../tree/WorldTree.js'
import { Box3, EllipseCurve, Matrix4, Vector2, Vector3 } from 'three'
import { GeometryConverter, SpeckleType } from '../GeometryConverter.js'
import Logger from '../../utils/Logger.js'

export class SpeckleGeometryConverter extends GeometryConverter {
  public typeLookupTable: { [type: string]: SpeckleType } = {}
  public meshTriangulationTime = 0
  public actualTriangulateTime = 0
  public pushTime = 0

  public getSpeckleType(node: NodeData): SpeckleType {
    const rawType = node.raw.speckle_type ? node.raw.speckle_type : 'Base'

    const lookup = this.typeLookupTable[rawType]
    if (lookup) {
      return lookup
    }

    let typeRet: SpeckleType = SpeckleType.Unknown
    let typeChain: string[] = []
    typeChain = rawType.split(':').reverse()
    typeChain = typeChain.map<string>((value: string) => {
      return value.split('.').reverse()[0]
    })
    for (const type of typeChain) {
      if (type in SpeckleType) {
        typeRet = type as SpeckleType
        break
      }
    }
    this.typeLookupTable[rawType] = typeRet
    return typeRet
  }

  public convertNodeToGeometryData(node: NodeData): GeometryData | null {
    const type = this.getSpeckleType(node)
    switch (type) {
      case SpeckleType.BlockInstance:
        return this.BlockInstanceToGeometryData(node)
      case SpeckleType.Pointcloud:
        return this.PointcloudToGeometryData(node)
      case SpeckleType.Brep:
        return this.BrepToGeometryData(node)
      case SpeckleType.Mesh:
        return this.MeshToGeometryData(node)
      case SpeckleType.Point:
        return this.PointToGeometryData(node)
      case SpeckleType.Line:
        return this.LineToGeometryData(node)
      case SpeckleType.Polyline:
        return this.PolylineToGeometryData(node)
      case SpeckleType.Box:
        return this.BoxToGeometryData(node)
      case SpeckleType.Polycurve:
        return this.PolycurveToGeometryData(node)
      case SpeckleType.Curve:
        return this.CurveToGeometryData(node)
      case SpeckleType.Circle:
        return this.CircleToGeometryData(node)
      case SpeckleType.Arc:
        return this.ArcToGeometryData(node)
      case SpeckleType.Ellipse:
        return this.EllipseToGeometryData(node)
      case SpeckleType.View3D:
        return this.View3DToGeometryData(node)
      case SpeckleType.RevitInstance:
        return this.RevitInstanceToGeometryData(node)
      case SpeckleType.Text:
        return this.TextToGeometryData(node)
      case SpeckleType.Transform:
        return this.TransformToGeometryData(node)
      case SpeckleType.InstanceProxy:
        return this.InstanceProxyToGeometyData(node)
      case SpeckleType.Unknown:
        // console.warn(`Skipping geometry conversion for ${type}`)
        return null
      default:
        return null
    }
  }

  public disposeNodeGeometryData(node: NodeData): void {
    const type = this.getSpeckleType(node)
    switch (type) {
      case SpeckleType.Pointcloud:
        node.raw.vertices = []
        node.raw.colors = []
        break
      case SpeckleType.Mesh:
        node.raw.vertices = []
        node.raw.faces = []
        node.raw.colors = []
        break
      case SpeckleType.Point:
        if (node.raw.value) node.raw.value = []
        else {
          delete node.raw.x
          delete node.raw.y
          delete node.raw.z
        }
        break
      case SpeckleType.Line:
        if (node.raw.start.value) node.raw.start.value = []
        else {
          delete node.raw.start.x
          delete node.raw.start.y
          delete node.raw.start.z
        }
        if (node.raw.end.value) node.raw.end.value = []
        else {
          delete node.raw.end.x
          delete node.raw.end.y
          delete node.raw.end.z
        }
        break
      case SpeckleType.Polyline:
        node.raw.value = []
        break

      default:
        break
    }
  }

  protected View3DToGeometryData(node: NodeData): GeometryData {
    const vOrigin = this.PointToVector3(node.raw.origin)
    const vTarget = this.PointToVector3(node.raw.target)
    node.raw.origin = vOrigin
    node.raw.target = vTarget

    return {
      attributes: null,
      bakeTransform: null,
      transform: null
    } as GeometryData
  }

  protected TransformToGeometryData(node: NodeData): GeometryData {
    const conversionFactor = getConversionFactor(node.raw.units)
    /**
     * Speckle matrices are row major. Three's 'fromArray' function assumes
     * the matrix is in column major. That's why we transpose it here.
     */
    /** Legacy "value" */
    const matrixData: number[] = node.raw.value ? node.raw.value : node.raw.matrix

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

  /** BLOCK INSTANCE */
  protected BlockInstanceToGeometryData(node: NodeData): GeometryData | null {
    node
    return null
  }

  /** REVIT INSTANCE */
  protected RevitInstanceToGeometryData(node: NodeData): GeometryData | null {
    node
    return null
  }

  /** DUI3 INSTANCE PROXY */
  protected InstanceProxyToGeometyData(node: NodeData): GeometryData | null {
    node
    return null
  }

  /**
   * POINT CLOUD
   */
  protected PointcloudToGeometryData(node: NodeData): GeometryData | null {
    const conversionFactor = getConversionFactor(node.raw.units)

    const vertices = node.instanced ? node.raw.points.slice() : node.raw.points
    const colorsRaw = node.raw.colors
    let colors = null

    if (colorsRaw && colorsRaw.length !== 0) {
      if (colorsRaw.length !== vertices.length / 3) {
        Logger.warn(
          `Mesh (id ${node.raw.id}) colours are mismatched with vertice counts. The number of colours must equal the number of vertices.`
        )
      }
      /** We want the colors in linear space */
      colors = this.unpackColors(colorsRaw, true)
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
  protected BrepToGeometryData(node: NodeData): GeometryData | null {
    /** Breps don't (currently) have inherent geometryic description in the viewer. They are replaced
     * by their mesh display values
     */
    node
    return null
  }

  /**
   * MESH
   */
  protected MeshToGeometryData(node: NodeData): GeometryData | null {
    if (!node.raw) return null

    const conversionFactor = getConversionFactor(node.raw.units)
    const indices = []

    if (!node.raw.vertices) return null
    if (!node.raw.faces) return null

    const start = performance.now()
    const vertices = node.raw.vertices
    const faces = node.raw.faces
    const colorsRaw = node.raw.colors
    let colors = undefined
    let k = 0
    while (k < faces.length) {
      let n = faces[k]
      if (n < 3) n += 3 // 0 -> 3, 1 -> 4

      if (n === 3) {
        const startP = performance.now()
        // Triangle face
        indices.push(faces[k + 1], faces[k + 2], faces[k + 3])
        this.pushTime += performance.now() - startP
      } else {
        // Quad or N-gon face
        const start1 = performance.now()
        const triangulation = MeshTriangulationHelper.triangulateFace(
          k,
          faces,
          vertices
        )
        this.actualTriangulateTime += performance.now() - start1
        indices.push(
          ...triangulation.filter((el) => {
            return el !== undefined
          })
        )
      }

      k += n + 1
    }
    this.meshTriangulationTime += performance.now() - start

    if (colorsRaw && colorsRaw.length !== 0) {
      if (colorsRaw.length !== vertices.length / 3) {
        Logger.warn(
          `Mesh (id ${node.raw.id}) colours are mismatched with vertice counts. The number of colours must equal the number of vertices.`
        )
      }
      /** We want the colors in linear space */
      colors = this.unpackColors(colorsRaw, true)
    }

    return {
      attributes: {
        POSITION: vertices,
        INDEX: indices,
        ...(colors && { COLOR: colors })
      },
      bakeTransform: new Matrix4().makeScale(
        conversionFactor,
        conversionFactor,
        conversionFactor
      ),
      transform: null,
      ...(node.instanced && { instanced: true })
    } as GeometryData
  }

  /**
   * TEXT
   */
  protected TextToGeometryData(node: NodeData): GeometryData | null {
    const conversionFactor = getConversionFactor(node.raw.units)
    const plane = node.raw.plane
    const position = new Vector3(plane.origin.x, plane.origin.y, plane.origin.z)
    const scale = new Matrix4().makeScale(
      conversionFactor,
      conversionFactor,
      conversionFactor
    )
    const mat = new Matrix4().makeBasis(plane.xdir, plane.ydir, plane.normal)
    mat.setPosition(position)
    mat.premultiply(scale)
    return {
      attributes: null,
      bakeTransform: mat,
      transform: null,
      metaData: node.raw
    } as GeometryData
  }

  /**
   * POINT
   */
  protected PointToGeometryData(node: NodeData): GeometryData | null {
    const conversionFactor = getConversionFactor(node.raw.units)
    return {
      attributes: {
        POSITION: this.PointToFloatArray(
          node.raw as { value: Array<number>; units: string } & {
            x: number
            y: number
            z: number
          }
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
   * LINE
   */
  protected LineToGeometryData(node: NodeData): GeometryData | null {
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
  protected PolylineToGeometryData(node: NodeData): GeometryData | null {
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
  protected BoxToGeometryData(node: NodeData): GeometryData | null {
    /**
     * Right, so we're cheating here a bit. We're using three's box geometry
     * to get the vertices and indices. Normally we could(should) do that by hand
     * but it's too late in the evenning atm...
     */
    const conversionFactor = getConversionFactor(node.raw.units)

    const T = new Matrix4()
    const R = new Matrix4()

    if (node.raw.basePlane) {
      T.setPosition(this.PointToVector3(node.raw.basePlane.origin))

      const eps = 1e-7
      const bX = new Vector3().copy(node.raw.basePlane.xdir)
      const bY = new Vector3().copy(node.raw.basePlane.ydir)
      const bZ = new Vector3().copy(node.raw.basePlane.normal)
      if (
        Math.abs(bX.dot(bY)) < eps &&
        Math.abs(bX.dot(bZ)) < eps &&
        Math.abs(bY.dot(bZ)) < eps
      )
        R.makeBasis(
          node.raw.basePlane.xdir,
          node.raw.basePlane.ydir,
          node.raw.basePlane.normal
        )
      else Logger.warn(`Box ${node.raw.id} does not have orthogonal base plane vectors`)
    } else Logger.warn(`Box ${node.raw.id} is missing it's base plane`)

    const width = (node.raw.xSize.end - node.raw.xSize.start) * conversionFactor
    const depth = (node.raw.ySize.end - node.raw.ySize.start) * conversionFactor
    const height = (node.raw.zSize.end - node.raw.zSize.start) * conversionFactor

    // const box = new BoxBufferGeometry(width, depth, height, 1, 1, 1)
    const box3 = new Box3(
      new Vector3(-width * 0.5, -depth * 0.5, -height * 0.5),
      new Vector3(width * 0.5, depth * 0.5, height * 0.5)
    )
    // prettier-ignore
    const edges = [
      box3.min.x, box3.min.y, box3.min.z, 
      box3.min.x, box3.max.y, box3.min.z,
      box3.min.x, box3.min.y, box3.max.z,
      box3.min.x, box3.max.y, box3.max.z,
      box3.min.x, box3.min.y, box3.min.z,
      box3.min.x, box3.min.y, box3.max.z,
      box3.min.x, box3.max.y, box3.min.z,
      box3.min.x, box3.max.y, box3.max.z,

      box3.max.x, box3.min.y, box3.min.z, 
      box3.max.x, box3.max.y, box3.min.z,
      box3.max.x, box3.min.y, box3.max.z,
      box3.max.x, box3.max.y, box3.max.z,
      box3.max.x, box3.min.y, box3.min.z,
      box3.max.x, box3.min.y, box3.max.z,
      box3.max.x, box3.max.y, box3.min.z,
      box3.max.x, box3.max.y, box3.max.z,

      box3.max.x, box3.min.y, box3.max.z, 
      box3.min.x, box3.min.y, box3.max.z,
      box3.max.x, box3.min.y, box3.min.z, 
      box3.min.x, box3.min.y, box3.min.z,
      box3.max.x, box3.max.y, box3.max.z, 
      box3.min.x, box3.max.y, box3.max.z,
      box3.max.x, box3.max.y, box3.min.z, 
      box3.min.x, box3.max.y, box3.min.z,
      
    ]

    return {
      attributes: {
        POSITION: edges
      },
      bakeTransform: new Matrix4().copy(T).multiply(R),
      transform: null
    } as GeometryData
  }

  /**
   * POLYCURVE
   */
  protected PolycurveToGeometryData(node: NodeData): GeometryData | null {
    if (!node.nestedNodes || node.nestedNodes.length === 0) {
      return null
    }
    const buffers = []

    for (let i = 0; i < node.nestedNodes.length; i++) {
      const element = node.nestedNodes[i].model
      const conv = this.convertNodeToGeometryData(element)
      buffers.push(conv)
    }
    return Geometry.mergeGeometryData(buffers as GeometryData[])
  }

  /**
   * CURVE
   */
  protected CurveToGeometryData(node: NodeData): GeometryData | null {
    if (!node.nestedNodes || node.nestedNodes.length === 0) {
      return null
    }

    const polylineGeometry = this.PolylineToGeometryData(node.nestedNodes[0].model)
    if (!polylineGeometry || !polylineGeometry.attributes) return null
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
  protected CircleToGeometryData(node: NodeData): GeometryData | null {
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
  protected ArcToGeometryData(node: NodeData): GeometryData | null {
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
  protected EllipseToGeometryData(node: NodeData): GeometryData | null {
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

  protected getCircularCurvePoints(
    plane: {
      xdir: { value: Array<number>; units: string } & {
        x: number
        y: number
        z: number
      }
      ydir: { value: Array<number>; units: string } & {
        x: number
        y: number
        z: number
      }
      origin: { value: Array<number>; units: string } & {
        x: number
        y: number
        z: number
      }
    },
    radius: number,
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

  protected PointToVector3(
    obj: { value: Array<number>; units: string } & { x: number; y: number; z: number },
    scale = true
  ) {
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

  protected PointToFloatArray(
    obj: { value: Array<number>; units: string } & { x: number; y: number; z: number }
  ) {
    if (obj.value) {
      return [obj.value[0], obj.value[1], obj.value[2]]
    } else {
      return [obj.x, obj.y, obj.z]
    }
  }

  protected FlattenVector3Array(input: Vector3[] | Vector2[]): number[] {
    const output = new Array(input.length * 3)
    const vBuff: Array<number> = []
    for (let k = 0, l = 0; k < input.length; k++, l += 3) {
      input[k].toArray(vBuff)
      output[l] = vBuff[0]
      output[l + 1] = vBuff[1]
      output[l + 2] = vBuff[2] ? vBuff[2] : 0
    }
    return output
  }

  protected unpackColors(int32Colors: number[], tolinear = false): number[] {
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
        colors[i * 3] = this.srgbToLinear(colors[i * 3])
        colors[i * 3 + 1] = this.srgbToLinear(colors[i * 3 + 1])
        colors[i * 3 + 2] = this.srgbToLinear(colors[i * 3 + 2])
      }
    }
    return colors
  }

  protected srgbToLinear(x: number) {
    if (x <= 0) return 0
    else if (x >= 1) return 1
    else if (x < 0.04045) return x / 12.92
    else return Math.pow((x + 0.055) / 1.055, 2.4)
  }
}
