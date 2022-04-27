import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'
// import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'

import ObjectWrapper from './ObjectWrapper'
import { getConversionFactor } from './Units'
import MeshTriangulationHelper from './MeshTriangulationHelper'
import { Matrix4 } from 'three'
import { Vector3 } from 'three'
import { Line3 } from 'three'

/**
 * Utility class providing some top level conversion methods.
 * Warning: HIC SVNT DRACONES.
 */
export default class Coverter {
  constructor(objectLoader) {
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

  async asyncPause() {
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
  async traverseAndConvert(obj, callback, scale = true, parents = []) {
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

    if (this[`${type}ToBufferGeometry`]) {
      try {
        await callback(await this[`${type}ToBufferGeometry`](obj.data || obj, scale))
        return
      } catch (e) {
        console.warn(
          `(Traversing - direct) Failed to convert ${type} with id: ${obj.id}`,
          e
        )
      }
    }

    const target = obj.data || obj

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
              convertedElement.bufferGeometry,
              obj,
              convertedElement.geometryType
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
              convertedElement.bufferGeometry,
              { renderMaterial: val.renderMaterial, ...obj },
              convertedElement.geometryType
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

  /**
   * Directly converts an object and invokes the callback with the the conversion result.
   * If you don't know what you're doing, use traverseAndConvert() instead.
   * @param  {[type]} obj [description]
   * @param  {Function} callback [description]
   * @return {[type]}     [description]
   */
  async convert(obj, scale = true) {
    if (obj.referencedId) obj = await this.resolveReference(obj)
    try {
      const type = this.getSpeckleType(obj)
      if (this[`${type}ToBufferGeometry`]) {
        return await this[`${type}ToBufferGeometry`](obj.data || obj, scale)
      } else {
        if(obj.displayValue) {
          const displayValue = await this.resolveReference(obj.displayValue);
          return await this.convert(displayValue, scale);
        }
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
  async dechunk(arr) {
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
  async resolveReference(obj) {
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
  getSpeckleType(obj) {
    let type = 'Base'
    if (obj.data)
      type = obj.data.speckle_type
        ? obj.data.speckle_type.split('.').reverse()[0]
        : type
    else type = obj.speckle_type ? obj.speckle_type.split('.').reverse()[0] : type
    return type
  }

  async View3DToBufferGeometry(obj) {
    obj.origin.units = obj.units
    obj.target.units = obj.units
    const origin = this.PointToVector3(obj.origin)
    const target = this.PointToVector3(obj.target)
    obj.origin = origin
    obj.target = target
    return new ObjectWrapper(obj, obj, 'View')
  }

  async BlockInstanceToBufferGeometry(obj, scale) {
    const cF = scale ? getConversionFactor(obj.units) : 1
    const definition = await this.resolveReference(obj.blockDefinition)

    const matrix = new THREE.Matrix4().set(
      ...(Array.isArray(obj.transform) ? obj.transform : obj.transform.value)
    )
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
      scaleMatrix: new THREE.Matrix4().makeScale(cF, cF, cF)
    })
  }

  async PointcloudToBufferGeometry(obj, scale = true) {
    const conversionFactor = scale ? getConversionFactor(obj.units) : 1
    const buffer = new THREE.BufferGeometry()

    const vertices = await this.dechunk(obj.points)

    buffer.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        !scale || conversionFactor === 1
          ? vertices
          : vertices.map((v) => v * conversionFactor),
        3
      )
    )

    const colorsRaw = await this.dechunk(obj.colors)

    if (colorsRaw && colorsRaw.length !== 0) {
      if (colorsRaw.length !== buffer.attributes.position.count) {
        console.warn(
          `Mesh (id ${obj.id}) colours are mismatched with vertice counts. The number of colours must equal the number of vertices.`
        )
      }

      buffer.setAttribute(
        'color',
        new THREE.BufferAttribute(
          new Float32Array(buffer.attributes.position.count * 3),
          3
        )
      )

      for (let i = 0; i < buffer.attributes.position.count; i++) {
        const color = colorsRaw[i]
        const r = (color >> 16) & 0xff
        const g = (color >> 8) & 0xff
        const b = color & 0xff
        buffer.attributes.color.setXYZ(i, r / 255, g / 255, b / 255)
      }
    }

    // delete obj.points
    // delete obj.colors
    // delete obj.sizes // note, these might be used in the future

    return new ObjectWrapper(buffer, obj, 'pointcloud')
  }

  async BrepToBufferGeometry(obj, scale = true) {
    try {
      if (!obj) return

      let displayValue = obj.displayValue || obj.displayMesh
      if (Array.isArray(displayValue)) displayValue = displayValue[0] //Just take the first display value for now (not ideal)

      const { bufferGeometry } = await this.MeshToBufferGeometry(
        await this.resolveReference(displayValue),
        scale
      )

      // deletes known unneeded fields
      // delete obj.displayMesh
      // delete obj.displayValue
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

  async MeshToBufferGeometry(obj, scale = true) {
    try {
      if (!obj) return

      const conversionFactor = getConversionFactor(obj.units)
      const buffer = new THREE.BufferGeometry()
      const indices = []

      if (!obj.vertices) return
      if (!obj.faces) return

      const vertices = await this.dechunk(obj.vertices)
      const faces = await this.dechunk(obj.faces)

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
          indices.push(...triangulation)
        }

        k += n + 1
      }

      if (vertices.length >= 65535 || indices.length >= 65535) {
        buffer.setIndex(new THREE.Uint32BufferAttribute(indices, 1))
      } else {
        buffer.setIndex(new THREE.Uint16BufferAttribute(indices, 1))
      }

      buffer.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(
          !scale || conversionFactor === 1
            ? vertices
            : vertices.map((v) => v * conversionFactor),
          3
        )
      )

      const colorsRaw = await this.dechunk(obj.colors)

      if (colorsRaw && colorsRaw.length !== 0) {
        if (colorsRaw.length !== buffer.attributes.position.count) {
          console.warn(
            `Mesh (id ${obj.id}) colours are mismatched with vertice counts. The number of colours must equal the number of vertices.`
          )
        }

        buffer.setAttribute(
          'color',
          new THREE.BufferAttribute(
            new Float32Array(buffer.attributes.position.count * 3),
            3
          )
        )

        for (let i = 0; i < buffer.attributes.position.count; i++) {
          const color = colorsRaw[i]
          const r = (color >> 16) & 0xff
          const g = (color >> 8) & 0xff
          const b = color & 0xff
          buffer.attributes.color.setXYZ(i, r / 255, g / 255, b / 255)
        }
      }

      buffer.computeVertexNormals()
      //buffer.computeFaceNormals( )
      buffer.computeBoundingSphere()

      // delete obj.vertices
      // delete obj.faces
      // delete obj.colors

      return new ObjectWrapper(buffer, obj)
    } catch (e) {
      console.warn(`Failed to convert mesh with id: ${obj.id}`)
      throw e
    }
  }

  async PointToBufferGeometry(obj, scale = true) {
    const v = this.PointToVector3(obj, scale)
    const buf = new THREE.BufferGeometry().setFromPoints([v])

    return new ObjectWrapper(buf, obj, 'point')
  }

  async LineToBufferGeometry(object, scale = true) {
    if (object.value) {
      //Old line format, treat as polyline
      return this.PolylineToBufferGeometry(object, scale)
    }
    const obj = {}
    Object.assign(obj, object)

    const geometry = new THREE.BufferGeometry().setFromPoints([
      this.PointToVector3(obj.start, scale),
      this.PointToVector3(obj.end, scale)
    ])
    return new ObjectWrapper(geometry, obj, 'line')
  }

  async PolylineToBufferGeometry(object, scale = true) {
    const obj = {}
    Object.assign(obj, object)

    const conversionFactor = scale ? getConversionFactor(obj.units) : 1

    obj.value = await this.dechunk(obj.value)

    const points = []
    for (let i = 0; i < obj.value.length; i += 3) {
      points.push(
        new THREE.Vector3(
          obj.value[i] * conversionFactor,
          obj.value[i + 1] * conversionFactor,
          obj.value[i + 2] * conversionFactor
        )
      )
    }
    if (obj.closed) points.push(points[0])

    const geometry = new THREE.BufferGeometry().setFromPoints(points)

    delete obj.value
    delete obj.bbox

    return new ObjectWrapper(geometry, obj, 'line')
  }

  async BoxToBufferGeometry(object, scale = true) {
    const conversionFactor = scale ? getConversionFactor(object.units) : 1

    const move = this.PointToVector3(object.basePlane.origin)
    const width = (object.xSize.end - object.xSize.start) * conversionFactor
    const depth = (object.ySize.end - object.ySize.start) * conversionFactor
    const height = (object.zSize.end - object.zSize.start) * conversionFactor

    const box = new THREE.BoxBufferGeometry(width, depth, height, 1, 1, 1)
    box.applyMatrix4(new THREE.Matrix4().setPosition(move))

    return new ObjectWrapper(box, object)
  }

  async PolycurveToBufferGeometry(object, scale = true) {
    const obj = {}
    Object.assign(obj, object)

    const buffers = []
    for (let i = 0; i < obj.segments.length; i++) {
      const element = obj.segments[i];
      const conv = await this.convert(element, scale)
      buffers.push(conv?.bufferGeometry)
    }
    const geometry = BufferGeometryUtils.mergeBufferGeometries(buffers)

    return new ObjectWrapper(geometry, obj, 'line')
  }

  async CurveToBufferGeometry(object, scale = true) {
    const obj = {}
    Object.assign(obj, object)
    const displayValue = await this.resolveReference(obj.displayValue)
    displayValue.units = displayValue.units || obj.units

    const poly = await this.PolylineToBufferGeometry(displayValue, scale)

    return new ObjectWrapper(poly.bufferGeometry, obj, 'line')
  }

  async CircleToBufferGeometry(obj, scale = true) {
    const conversionFactor = scale ? getConversionFactor(obj.units) : 1
    const points = this.getCircularCurvePoints(obj.plane, obj.radius * conversionFactor)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)

    // delete obj.plane
    // delete obj.value
    // delete obj.speckle_type
    // delete obj.bbox

    return new ObjectWrapper(geometry, obj, 'line')
  }

  async ArcToBufferGeometry(obj, scale = true) {
    /**
     * Old implementation
     */
    // const radius = obj.radius
    // const curve = new THREE.EllipseCurve(
    //   0,
    //   0, // ax, aY
    //   radius,
    //   radius, // xRadius, yRadius
    //   obj.startAngle,
    //   obj.endAngle, // aStartAngle, aEndAngle
    //   false, // aClockwise
    //   0 // aRotation
    // )
    // const points = curve.getPoints(50);
    // const t = this.PlaneToMatrix4(obj.plane, scale);
    // const geometry = new THREE.BufferGeometry()
    //   .setFromPoints(points)
    //   .applyMatrix4(t)
    // return new ObjectWrapper(geometry, obj, 'line')
    
    /**
     * New implementation, a bit verbose, but it's cleared this way.
     */
    const origin = new Vector3(obj.plane.origin.x, obj.plane.origin.y, obj.plane.origin.z);
    const startPoint = new Vector3(obj.startPoint.x, obj.startPoint.y, obj.startPoint.z);
    const endPoint = new Vector3(obj.endPoint.x, obj.endPoint.y, obj.endPoint.z);
    const midPoint = new Vector3(obj.midPoint.x, obj.midPoint.y, obj.midPoint.z);

    const sagitta = new Line3(startPoint, endPoint);
    // This the projection of the origin on the sagitta
    const sagittaCenter = sagitta.getCenter(new Vector3());
    // Direction from the origin to the mid point
    const d0 = new Vector3().subVectors(midPoint, origin); d0.normalize();
    // Direction from the origin to it;s projection on the sagitta
    const d1 = new Vector3().subVectors(sagittaCenter, origin); d1.normalize();
    // If the two above directions point in opposite directions, we need to reverse the arc's winding order
    const _clockwise = d0.dot(d1) < 0;

    // Here we compute arc's basis vectors using the origin and the two end points.
    const v0 = new Vector3().subVectors(startPoint, origin); v0.normalize()
    const v1 = new Vector3().subVectors(endPoint, origin); v1.normalize();
    const v2 = new Vector3().crossVectors(v0, v1); v2.normalize();
    const v3 = new Vector3().crossVectors(v2, v0); v3.normalize();

    // This is just the angle between the start and end points. Should be same as obj.angleRadians(or something)
    const angle = Math.acos(v0.dot(v1));
    const radius = obj.radius
    // We draw the arc in a local un-rotated coordinate system. We rotate it later on via transformation
    const curve = new THREE.EllipseCurve(
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
    const points = curve.getPoints(50);

    const matrix = new Matrix4()
    // Scale first, in order for the composition to work correctly
    const conversionFactor = scale ? getConversionFactor(obj.plane.units) : 1
    if (scale) {
      matrix.scale(new THREE.Vector3(conversionFactor, conversionFactor, conversionFactor))
    }
    // We determine the orientation of the plane using the three basis vectors computed above
    matrix.makeBasis(v0, v3, v2);
    // We translate it to the circle's origin
    matrix.setPosition(origin);
    
    const geometry = new THREE.BufferGeometry()
      .setFromPoints(points)
      .applyMatrix4(matrix)

    /**
     * Temporary, just for debugging
     */
    // const sphere = new THREE.Mesh( new THREE.SphereGeometry( 0.25, 32, 16 ), new THREE.MeshBasicMaterial( { color: 0xffff00 } ) );
    // sphere.position.copy(origin);
    // window.v.scene.add(sphere);

    // const spherePoints0 = new THREE.Mesh( new THREE.SphereGeometry( 0.1, 32, 16 ), new THREE.MeshBasicMaterial( { color: 0xff0000 } ) );
    // spherePoints0.position.copy(startPoint);
    // window.v.scene.add(spherePoints0);

    // const spherePoints1 = new THREE.Mesh( new THREE.SphereGeometry( 0.1, 32, 16 ), new THREE.MeshBasicMaterial( { color: 0xff0000 } ) );
    // spherePoints1.position.copy(endPoint);
    // window.v.scene.add(spherePoints1);

    return new ObjectWrapper(geometry, obj, 'line')
  }

  async EllipseToBufferGeometry(obj, scale = true) {
    const conversionFactor = scale ? getConversionFactor(obj.units) : 1

    const center = new THREE.Vector3(
      obj.plane.origin.x,
      obj.plane.origin.y,
      obj.plane.origin.z
    ).multiplyScalar(conversionFactor)
    const xAxis = new THREE.Vector3(
      obj.plane.xdir.x,
      obj.plane.xdir.y,
      obj.plane.xdir.z
    ).normalize()
    const yAxis = new THREE.Vector3(
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
      const xMove = new THREE.Vector3(xAxis.x * x, xAxis.y * x, xAxis.z * x)
      const yMove = new THREE.Vector3(yAxis.x * y, yAxis.y * y, yAxis.z * y)

      const pt = new THREE.Vector3().addVectors(xMove, yMove).add(center)
      points.push(pt)
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    return new ObjectWrapper(geometry, obj, 'line')
  }

  PlaneToMatrix4(plane, scale = true) {
    const m = new THREE.Matrix4()
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
      m.scale(new THREE.Vector3(conversionFactor, conversionFactor, conversionFactor))
    }
    return m
  }

  getCircularCurvePoints(
    plane,
    radius,
    startAngle = 0,
    endAngle = 2 * Math.PI,
    res = this.curveSegmentLength
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
      const xMove = new THREE.Vector3(xAxis.x * x, xAxis.y * x, xAxis.z * x)
      const yMove = new THREE.Vector3(yAxis.x * y, yAxis.y * y, yAxis.z * y)

      const pt = new THREE.Vector3().addVectors(xMove, yMove).add(center)
      points.push(pt)
    }
    return points
  }

  PointToVector3(obj, scale = true) {
    const conversionFactor = scale ? getConversionFactor(obj.units) : 1
    let v = null
    if (obj.value) {
      // Old point format based on value list
      v = new THREE.Vector3(
        obj.value[0] * conversionFactor,
        obj.value[1] * conversionFactor,
        obj.value[2] * conversionFactor
      )
    } else {
      // New point format based on cartesian coords
      v = new THREE.Vector3(
        obj.x * conversionFactor,
        obj.y * conversionFactor,
        obj.z * conversionFactor
      )
    }
    return v
  }
}
