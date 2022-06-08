import ObjectWrapper from './ObjectWrapper'
import { getConversionFactor } from './Units'
import MeshTriangulationHelper from './MeshTriangulationHelper'
import { Geometry, GeometryData } from './Geometry'
import { BoxBufferGeometry, EllipseCurve, Matrix4, Vector2 } from 'three'
import { Vector3 } from 'three'
import { Line3 } from 'three'

export type ConverterResultDelegate = (
  object: ObjectWrapper | undefined
) => Promise<void>
export type ConverterGeometryDelegate = (
  object,
  scale?: boolean
) => Promise<ObjectWrapper | undefined>
export type ConverterGeometryDataDelegate = (
  object,
  scale?: boolean
) => Promise<GeometryData>

/**
 * Utility class providing some top level conversion methods.
 * Warning: HIC SVNT DRACONES.
 */
export default class Coverter {
  private objectLoader
  private curveSegmentLength: number
  private lastAsyncPause: number
  private activePromises: number
  private maxChildrenPromises: number

  private readonly GeometryConverterMapping: {
    [name: string]: ConverterGeometryDelegate
  } = {
    View3D: this.View3DToBufferGeometry.bind(this),
    BlockInstance: this.BlockInstanceToBufferGeometry.bind(this),
    Pointcloud: this.PointcloudToBufferGeometry.bind(this),
    Brep: this.BrepToBufferGeometry.bind(this),
    Mesh: this.MeshToBufferGeometry.bind(this),
    Point: this.PointToBufferGeometry.bind(this),
    Line: this.LineToBufferGeometry.bind(this),
    Polyline: this.PolylineToBufferGeometry.bind(this),
    Box: this.BoxToBufferGeometry.bind(this),
    Polycurve: this.PolycurveToBufferGeometry.bind(this),
    Curve: this.CurveToBufferGeometry.bind(this),
    Circle: this.CircleToBufferGeometry.bind(this),
    Arc: this.ArcToBufferGeometry.bind(this),
    Ellipse: this.EllipseToBufferGeometry.bind(this)
  }

  private readonly GeometryDataConverterMapping: {
    [name: string]: ConverterGeometryDataDelegate
  } = {
    View3D: this.View3DToBufferGeometry.bind(this),
    BlockInstance: this.BlockInstanceToBufferGeometry.bind(this),
    Pointcloud: this.PointcloudToGeometryData.bind(this),
    Brep: this.MeshToGeometryData.bind(this),
    Mesh: this.MeshToGeometryData.bind(this),
    Point: this.PointToGeometryData.bind(this),
    Line: this.LineToGeometryData.bind(this),
    Polyline: this.PolylineToGeometryData.bind(this),
    Box: this.BoxToGeometryData.bind(this),
    Polycurve: this.PolycurveToGeometryData.bind(this),
    Curve: this.PolylineToGeometryData.bind(this),
    Circle: this.CircleToGeometryData.bind(this),
    Arc: this.ArcToGeometryData.bind(this),
    Ellipse: this.EllipseToGeometryData.bind(this)
  }

  constructor(objectLoader: unknown) {
    if (!objectLoader) {
      console.warn(
        'Converter initialized without a corresponding object loader. Any objects that include references will throw errors.'
      )
    }

    this.objectLoader = objectLoader
    this.curveSegmentLength = 0.1

    this.lastAsyncPause = Date.now()
    this.activePromises = 0
    this.maxChildrenPromises = 200
  }

  private async asyncPause() {
    // Don't freeze the UI when doing all those traversals
    if (Date.now() - this.lastAsyncPause >= 100) {
      this.lastAsyncPause = Date.now()
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  /**
   * If the object is convertible (there is a direct conversion routine), it will invoke the callback with the conversion result.
   * If the object is not convertible, it will recursively iterate through it (arrays & objects) and invoke the callback on any positive conversion result.
   * @param  {[type]}   obj      [description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  public async traverseAndConvert(
    obj,
    callback: ConverterResultDelegate,
    scale = true,
    parents: [] = []
  ) {
    await this.asyncPause()

    // Exit on primitives (string, ints, bools, bigints, etc.)
    if (obj === null || typeof obj !== 'object') return
    if (obj.referencedId) obj = await this.resolveReference(obj)

    const childrenConversionPromisses = []

    // Traverse arrays, and exit early (we don't want to iterate through many numbers)
    if (Array.isArray(obj)) {
      for (const element of obj) {
        if (typeof element !== 'object') break // exit early for non-object based arrays
        if (this.activePromises >= this.maxChildrenPromises) {
          await this.traverseAndConvert(element, callback, scale, parents)
        } else {
          const childPromise = this.traverseAndConvert(
            element,
            callback,
            scale,
            parents
          )
          childrenConversionPromisses.push(childPromise)
        }
      }
      this.activePromises += childrenConversionPromisses.length
      await Promise.all(childrenConversionPromisses)
      this.activePromises -= childrenConversionPromisses.length
      return
    }

    // Keep track of parents. An object is his own parent, for the simplicity of working with subtrees
    obj.__parents = [...parents, obj.id]

    // If we can convert it, we should invoke the respective conversion routine.
    const type = this.getSpeckleType(obj)

    if (this.directConverterExists(obj)) {
      try {
        await callback(await this.directConvert(obj.data || obj, scale))
        return
      } catch (e) {
        console.warn(
          `(Traversing - direct) Failed to convert ${type} with id: ${obj.id}`,
          e
        )
      }
    }

    const target = obj //obj.data || obj

    // Check if the object has a display value of sorts
    let displayValue =
      target['displayMesh'] ||
      target['@displayMesh'] ||
      target['displayValue'] ||
      target['@displayValue']
    if (displayValue) {
      if (!Array.isArray(displayValue)) {
        displayValue = await this.resolveReference(displayValue)
        if (!displayValue.units) displayValue.units = obj.units
        try {
          const convertedElement = await this.convert(displayValue, scale)
          await callback(
            new ObjectWrapper(
              convertedElement?.bufferGeometry,
              obj,
              convertedElement?.geometryType
            )
          ) // use the parent's metadata!
        } catch (e) {
          console.warn(
            `(Traversing) Failed to convert obj with id: ${obj.id} — ${e.message}`
          )
        }
      } else {
        for (const element of displayValue) {
          const val = await this.resolveReference(element)
          if (!val.units) val.units = obj.units
          const convertedElement = await this.convert(val, scale)
          await callback(
            new ObjectWrapper(
              convertedElement?.bufferGeometry,
              { renderMaterial: val.renderMaterial, ...obj },
              convertedElement?.geometryType
            )
          )
        }
      }

      // If this is a built element and has a display value, only iterate through the "elements" prop if it exists.
      if (obj.speckle_type.toLowerCase().includes('builtelements')) {
        if (obj['elements']) {
          childrenConversionPromisses.push(
            this.traverseAndConvert(obj['elements'], callback, scale, obj.__parents)
          )
          this.activePromises += childrenConversionPromisses.length
          await Promise.all(childrenConversionPromisses)
          this.activePromises -= childrenConversionPromisses.length
        }

        return
      }
    }

    // Last attempt: iterate through all object keys and see if we can display anything!
    // traverses the object in case there's any sub-objects we can convert.
    for (const prop in target) {
      if (prop === '__parents' || prop === 'bbox') continue
      if (
        ['displayMesh', '@displayMesh', 'displayValue', '@displayValue'].includes(prop)
      )
        continue
      if (typeof target[prop] !== 'object' || target[prop] === null) continue

      if (this.activePromises >= this.maxChildrenPromises) {
        await this.traverseAndConvert(target[prop], callback, scale, obj.__parents)
      } else {
        const childPromise = this.traverseAndConvert(
          target[prop],
          callback,
          scale,
          obj.__parents
        )
        childrenConversionPromisses.push(childPromise)
      }
    }
    this.activePromises += childrenConversionPromisses.length
    await Promise.all(childrenConversionPromisses)
    this.activePromises -= childrenConversionPromisses.length
  }

  private directConverterExists(obj) {
    return this.getSpeckleType(obj) in this.GeometryConverterMapping
  }

  private directConvert(obj, scale = true): Promise<ObjectWrapper | undefined> {
    return this.GeometryConverterMapping[this.getSpeckleType(obj)](obj, scale)
  }

  private convertToGeometryData(obj, scale = true): Promise<GeometryData> {
    return this.GeometryDataConverterMapping[this.getSpeckleType(obj)](obj, scale)
  }

  private getDisplayValue(obj) {
    return (
      obj['displayValue'] ||
      obj['@displayValue'] ||
      obj['displayMesh'] ||
      obj['@displayMesh']
    )
  }

  /**
   * Directly converts an object and invokes the callback with the the conversion result.
   * If you don't know what you're doing, use traverseAndConvert() instead.
   * @param  {[type]} obj [description]
   * @param  {Function} callback [description]
   * @return {[type]}     [description]
   */
  private async convert(obj, scale = true) {
    if (obj.referencedId) obj = await this.resolveReference(obj)
    try {
      if (this.directConverterExists(obj)) {
        return await this.directConvert(obj.data || obj, scale)
      }
      return null
    } catch (e) {
      console.warn(`(Direct convert) Failed to convert object with id: ${obj.id}`)
      throw e
    }
  }

  /**
   * Takes an array composed of chunked references and dechunks it.
   * @param  {[type]} arr [description]
   * @return {[type]}     [description]
   */
  private async dechunk(arr) {
    if (!arr || arr.length === 0) return arr
    // Handles pre-chunking objects, or arrs that have not been chunked
    if (!arr[0].referencedId) return arr

    const chunked = []
    for (const ref of arr) {
      const real = await this.objectLoader.getObject(ref.referencedId)
      chunked.push(real.data)
      // await this.asyncPause()
    }

    const dechunked = [].concat(...chunked)

    return dechunked
  }

  /**
   * Resolves an object reference by waiting for the loader to load it up.
   * @param  {[type]} obj [description]
   * @return {[type]}     [description]
   */
  private async resolveReference(obj) {
    if (obj.referencedId) {
      const resolvedObj = await this.objectLoader.getObject(obj.referencedId)
      // this.asyncPause()
      return resolvedObj
    } else return obj
  }

  /**
   * Gets the speckle type of an object in various scenarios.
   * @param  {[type]} obj [description]
   * @return {[type]}     [description]
   */
  private getSpeckleType(obj): string {
    let type = 'Base'
    if (obj.data)
      type = obj.data.speckle_type
        ? obj.data.speckle_type.split('.').reverse()[0]
        : type
    else type = obj.speckle_type ? obj.speckle_type.split('.').reverse()[0] : type
    return type
  }

  /**
   * VIEW 3D
   */
  private async View3DToBufferGeometry(obj) {
    obj.origin.units = obj.units
    obj.target.units = obj.units
    const origin = this.PointToVector3(obj.origin)
    const target = this.PointToVector3(obj.target)
    obj.origin = origin
    obj.target = target
    return new ObjectWrapper(obj, obj, 'View')
  }

  /**
   * BLOCK INSTANCE
   */
  private async BlockInstanceToBufferGeometry(obj, scale?: boolean) {
    const cF = scale ? getConversionFactor(obj.units) : 1
    const definition = await this.resolveReference(obj.blockDefinition)

    /**
     * Speckle matrices are row major. Three's 'fromArray' function assumes
     * the matrix is in column major. That's why we transpose it here.
     */
    const matrixData: number[] = Array.isArray(obj.transform)
      ? obj.transform
      : obj.transform.value
    const matrix = new Matrix4().fromArray(matrixData).transpose()

    const geoms = []
    for (const obj of definition.geometry) {
      // Note: we are passing scale = false to the conversion of all objects, as scaling *needs* to happen
      // at a global group level.
      const res = await this.convert(await this.resolveReference(obj), false)
      // We are not baking the matrix transform in the vertices so as to allow
      // for easy composed transforms coming in at nested block levels
      // res.bufferGeometry.applyMatrix4( matrix )
      geoms.push(res)
    }

    return new ObjectWrapper(geoms, obj, 'block', {
      transformMatrix: matrix,
      scaleMatrix: new Matrix4().makeScale(cF, cF, cF)
    })
  }

  /**
   * POINT CLOUD
   */
  private async PointcloudToGeometryData(obj, scale = true) {
    const conversionFactor = scale ? getConversionFactor(obj.units) : 1

    const vertices = await this.dechunk(obj.points)
    const colorsRaw = await this.dechunk(obj.colors)
    let colors = null

    if (colorsRaw && colorsRaw.length !== 0) {
      if (colorsRaw.length !== vertices.length / 3) {
        console.warn(
          `Mesh (id ${obj.id}) colours are mismatched with vertice counts. The number of colours must equal the number of vertices.`
        )
      }
      colors = Geometry.unpackColors(colorsRaw)
    }
    return {
      attributes: {
        POSITION: vertices,
        COLOR: colors
      },
      bakeTransform: scale
        ? new Matrix4().makeScale(conversionFactor, conversionFactor, conversionFactor)
        : null,
      transform: null
    } as GeometryData
  }

  private async PointcloudToBufferGeometry(obj, scale = true) {
    return new ObjectWrapper(
      Geometry.makePointCloudGeometry(await this.PointcloudToGeometryData(obj, scale)),
      obj,
      'pointcloud'
    )
  }

  /**
   * BREP
   */
  private async BrepToBufferGeometry(obj, scale = true) {
    try {
      if (!obj) return

      let displayValue = obj.displayValue || obj.displayMesh
      if (Array.isArray(displayValue)) displayValue = displayValue[0] //Just take the first display value for now (not ideal)

      const { bufferGeometry } = await this.MeshToBufferGeometry(
        await this.resolveReference(displayValue),
        scale
      )

      // deletes known unneeded fields
      delete obj.Edges
      delete obj.Faces
      delete obj.Loops
      delete obj.Trims
      delete obj.Curve2D
      delete obj.Curve3D
      delete obj.Surfaces
      delete obj.Vertices

      return new ObjectWrapper(bufferGeometry, obj)
    } catch (e) {
      console.warn(`Failed to convert brep id: ${obj.id}`)
      throw e
    }
  }

  /**
   * MESH
   */
  private async MeshToGeometryData(obj, scale = true): Promise<GeometryData> {
    if (!obj) return

    const conversionFactor = getConversionFactor(obj.units)
    // const buffer = new BufferGeometry()
    const indices = []

    if (!obj.vertices) return
    if (!obj.faces) return

    const vertices = await this.dechunk(obj.vertices)
    const faces = await this.dechunk(obj.faces)
    const colorsRaw = await this.dechunk(obj.colors)
    let colors = null

    let k = 0
    while (k < faces.length) {
      let n = faces[k]
      if (n <= 3) n += 3 // 0 -> 3, 1 -> 4

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
        console.warn(
          `Mesh (id ${obj.id}) colours are mismatched with vertice counts. The number of colours must equal the number of vertices.`
        )
      }
      colors = Geometry.unpackColors(colorsRaw)
    }

    return {
      attributes: {
        POSITION: vertices,
        INDEX: indices,
        COLOR: colors
      },
      bakeTransform: scale
        ? new Matrix4().makeScale(conversionFactor, conversionFactor, conversionFactor)
        : null,
      transform: null
    } as GeometryData
  }

  private async MeshToBufferGeometry(obj, scale = true) {
    try {
      return new ObjectWrapper(
        Geometry.makeMeshGeometry(await this.MeshToGeometryData(obj, scale)),
        obj
      )
    } catch (e) {
      console.warn(`Failed to convert mesh with id: ${obj.id}`)
      throw e
    }
  }

  /**
   * POINT
   */
  private async PointToGeometryData(obj, scale = true): Promise<GeometryData> {
    const conversionFactor = scale ? getConversionFactor(obj.units) : 1
    return {
      attributes: {
        POSITION: this.PointToFloatArray(obj)
      },
      bakeTransform: scale
        ? new Matrix4().makeScale(conversionFactor, conversionFactor, conversionFactor)
        : null,
      transform: null
    } as GeometryData
  }

  private async PointToBufferGeometry(obj, scale = true) {
    return new ObjectWrapper(
      Geometry.makePointGeometry(await this.PointToGeometryData(obj, scale)),
      obj,
      'point'
    )
  }

  /**
   * LINE
   */
  private async LineToGeometryData(obj, scale = true): Promise<GeometryData> {
    const conversionFactor = scale ? getConversionFactor(obj.units) : 1
    return {
      attributes: {
        POSITION: this.PointToFloatArray(obj.start).concat(
          this.PointToFloatArray(obj.end)
        )
      },
      bakeTransform: scale
        ? new Matrix4().makeScale(conversionFactor, conversionFactor, conversionFactor)
        : null,
      transform: null
    } as GeometryData
  }

  private async LineToBufferGeometry(obj, scale = true) {
    if (obj.value) {
      //Old line format, treat as polyline
      return this.PolylineToBufferGeometry(obj, scale)
    }

    const geometry = Geometry.makeLineGeometry(
      await this.LineToGeometryData(obj, scale)
    )
    return new ObjectWrapper(geometry, obj, 'line')
  }

  /**
   * POLYLINE
   */
  private async PolylineToGeometryData(object, scale = true): Promise<GeometryData> {
    const obj = Object.create({})
    Object.assign(obj, object)

    const conversionFactor = scale ? getConversionFactor(obj.units) : 1

    obj.value = await this.dechunk(obj.value)

    if (obj.closed) obj.value.push(obj.value[0], obj.value[1], obj.value[2])
    return {
      attributes: {
        POSITION: obj.value
      },
      bakeTransform: scale
        ? new Matrix4().makeScale(conversionFactor, conversionFactor, conversionFactor)
        : null,
      transform: null
    } as GeometryData
  }

  async PolylineToBufferGeometry(obj, scale = true) {
    const geometry = Geometry.makeLineGeometry(
      await this.PolylineToGeometryData(obj, scale)
    )

    return new ObjectWrapper(geometry, obj, 'line')
  }

  /**
   * BOX
   */
  private async BoxToGeometryData(object, scale = true) {
    /**
     * Right, so we're cheating here a bit. We're using three's box geometry
     * to get the vertices and indices. Normally we could(should) do that by hand
     * but it's too late in the evenning atm...
     */
    const conversionFactor = scale ? getConversionFactor(object.units) : 1

    const move = this.PointToVector3(object.basePlane.origin)
    const width = (object.xSize.end - object.xSize.start) * conversionFactor
    const depth = (object.ySize.end - object.ySize.start) * conversionFactor
    const height = (object.zSize.end - object.zSize.start) * conversionFactor

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
  async BoxToBufferGeometry(object, scale = true) {
    return new ObjectWrapper(
      Geometry.makeMeshGeometry(await this.BoxToGeometryData(object, scale)),
      object
    )
  }

  /**
   * POLYCURVE
   */
  async PolycurveToGeometryData(object, scale = true): Promise<GeometryData> {
    const obj = Object.create({})
    Object.assign(obj, object)

    const buffers = []
    for (let i = 0; i < obj.segments.length; i++) {
      let element = obj.segments[i]
      let conv
      if (this.directConverterExists(element))
        conv = await this.convertToGeometryData(element, scale)
      else if ((element = this.getDisplayValue(element)) !== undefined)
        conv = await this.convertToGeometryData(element, scale)

      buffers.push(conv)
    }

    return Geometry.mergeGeometryData(buffers)
  }

  async PolycurveToBufferGeometry(object, scale = true) {
    const geometryData: GeometryData = await this.PolycurveToGeometryData(object, scale)
    const geometry = Geometry.makeLineGeometry(geometryData)

    return new ObjectWrapper(geometry, Object.assign({}, object), 'line')
  }

  /**
   * CURVE
   */
  async CurveToBufferGeometry(object, scale = true) {
    const obj = Object.create({})
    Object.assign(obj, object)
    const displayValue = await this.resolveReference(obj.displayValue)
    displayValue.units = displayValue.units || obj.units

    const poly = await this.PolylineToBufferGeometry(displayValue, scale)

    return new ObjectWrapper(poly.bufferGeometry, obj, 'line')
  }

  /**
   * CIRCLE
   */
  async CircleToGeometryData(obj, scale = true) {
    const conversionFactor = scale ? getConversionFactor(obj.units) : 1
    const points = this.getCircularCurvePoints(
      obj.plane,
      obj.radius * conversionFactor,
      0,
      2 * Math.PI,
      scale
        ? this.curveSegmentLength * getConversionFactor(obj.units)
        : this.curveSegmentLength,
      scale
    )
    return {
      attributes: {
        POSITION: this.FlattenVector3Array(points)
      },
      bakeTransform: null,
      transform: null
    } as GeometryData
  }
  async CircleToBufferGeometry(obj, scale = true) {
    const geometry = Geometry.makeLineGeometry(
      await this.CircleToGeometryData(obj, scale)
    )
    return new ObjectWrapper(geometry, obj, 'line')
  }

  /**
   * ARC
   */
  async ArcToGeometryData(obj, scale = true) {
    const origin = new Vector3(
      obj.plane.origin.x,
      obj.plane.origin.y,
      obj.plane.origin.z
    )
    const startPoint = new Vector3(obj.startPoint.x, obj.startPoint.y, obj.startPoint.z)
    const endPoint = new Vector3(obj.endPoint.x, obj.endPoint.y, obj.endPoint.z)
    const midPoint = new Vector3(obj.midPoint.x, obj.midPoint.y, obj.midPoint.z)

    const chord = new Line3(startPoint, endPoint)
    // This the projection of the origin on the chord
    const chordCenter = chord.getCenter(new Vector3())
    // Direction from the origin to the mid point
    const d0 = new Vector3().subVectors(midPoint, origin)
    d0.normalize()
    // Direction from the origin to it;s projection on the chord
    const d1 = new Vector3().subVectors(chordCenter, origin)
    d1.normalize()
    // If the two above directions point in opposite directions, we need to reverse the arc's winding order
    const _clockwise = d0.dot(d1) < 0

    // Here we compute arc's orthonormal basis vectors using the origin and the two end points.
    const v0 = new Vector3().subVectors(startPoint, origin)
    v0.normalize()
    const v1 = new Vector3().subVectors(endPoint, origin)
    v1.normalize()
    const v2 = new Vector3().crossVectors(v0, v1)
    v2.normalize()
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
    const radius = obj.radius
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
    const conversionFactor = scale ? getConversionFactor(obj.plane.units) : 1
    // We determine the orientation of the plane using the three basis vectors computed above
    const R = new Matrix4().makeBasis(v0, v3, v2)
    // We translate it to the circle's origin (considering the origin's scaling as aswell )
    const T = new Matrix4().setPosition(origin.multiplyScalar(conversionFactor))

    matrix.multiply(T).multiply(R)

    if (scale) {
      const S = new Matrix4().scale(
        new Vector3(conversionFactor, conversionFactor, conversionFactor)
      )
      matrix.multiply(S)
    }

    return {
      attributes: {
        POSITION: this.FlattenVector3Array(points)
      },
      bakeTransform: matrix,
      transform: null
    } as GeometryData
  }

  async ArcToBufferGeometry(obj, scale = true) {
    const geometry = Geometry.makeLineGeometry(await this.ArcToGeometryData(obj, scale))

    return new ObjectWrapper(geometry, obj, 'line')
  }

  /**
   * ELLIPSE
   */
  async EllipseToGeometryData(obj, scale = true) {
    const conversionFactor = scale ? getConversionFactor(obj.units) : 1

    const center = new Vector3(
      obj.plane.origin.x,
      obj.plane.origin.y,
      obj.plane.origin.z
    ).multiplyScalar(conversionFactor)
    const xAxis = new Vector3(
      obj.plane.xdir.x,
      obj.plane.xdir.y,
      obj.plane.xdir.z
    ).normalize()
    const yAxis = new Vector3(
      obj.plane.ydir.x,
      obj.plane.ydir.y,
      obj.plane.ydir.z
    ).normalize()

    let resolution = 2 * Math.PI * obj.firstRadius * conversionFactor * 10
    resolution = parseInt(resolution.toString())
    const points = []

    for (let index = 0; index <= resolution; index++) {
      const t = (index * Math.PI * 2) / resolution
      const x = Math.cos(t) * obj.firstRadius * conversionFactor
      const y = Math.sin(t) * obj.secondRadius * conversionFactor
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

  async EllipseToBufferGeometry(obj, scale = true) {
    const geometry = Geometry.makeLineGeometry(
      await this.EllipseToGeometryData(obj, scale)
    )
    return new ObjectWrapper(geometry, obj, 'line')
  }

  /**
   * UTILS
   */
  PlaneToMatrix4(plane, scale = true) {
    const m = new Matrix4()
    const conversionFactor = scale ? getConversionFactor(plane.units) : 1

    m.makeBasis(
      this.PointToVector3(plane.xdir).normalize(),
      this.PointToVector3(plane.ydir).normalize(),
      this.PointToVector3(plane.normal).normalize()
    )
    m.setPosition(this.PointToVector3(plane.origin))
    /**
     * I think scaling should be done first.
     */
    if (scale) {
      m.scale(new Vector3(conversionFactor, conversionFactor, conversionFactor))
    }
    return m
  }

  getCircularCurvePoints(
    plane,
    radius,
    startAngle = 0,
    endAngle = 2 * Math.PI,
    res = this.curveSegmentLength,
    scale
  ) {
    // Get alignment vectors
    const center = this.PointToVector3(plane.origin, scale)
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

  PointToVector3(obj, scale = true) {
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

  PointToFloatArray(obj) {
    if (obj.value) {
      return [obj.value[0], obj.value[1], obj.value[2]]
    } else {
      return [obj.x, obj.y, obj.z]
    }
  }

  FlattenVector3Array(input: Vector3[] | Vector2[]): number[] {
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
}
