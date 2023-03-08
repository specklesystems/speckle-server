/* eslint-disable @typescript-eslint/no-unused-vars */
import { generateUUID } from 'three/src/math/MathUtils'
import { TreeNode, WorldTree } from '../tree/WorldTree'
import Logger from 'js-logger'

export type ConverterResultDelegate = (object) => Promise<void>

export type ConverterNodeDelegate = (object, node) => Promise<void>
/**
 * Utility class providing some top level conversion methods.
 * Warning: HIC SVNT DRACONES.
 */
export default class Coverter {
  private objectLoader
  private lastAsyncPause: number
  private activePromises: number
  private maxChildrenPromises: number
  private spoofIDs = true
  private isRoot = true

  private readonly NodeConverterMapping: {
    [name: string]: ConverterNodeDelegate
  } = {
    View3D: this.View3DToNode.bind(this),
    BlockInstance: this.BlockInstanceToNode.bind(this),
    Pointcloud: this.PointcloudToNode.bind(this),
    Brep: this.BrepToNode.bind(this),
    Mesh: this.MeshToNode.bind(this),
    Point: this.PointToNode.bind(this),
    Line: this.LineToNode.bind(this),
    Polyline: this.PolylineToNode.bind(this),
    Box: this.BoxToNode.bind(this),
    Polycurve: this.PolycurveToNode.bind(this),
    Curve: this.CurveToNode.bind(this),
    Circle: this.CircleToNode.bind(this),
    Arc: this.ArcToNode.bind(this),
    Ellipse: this.EllipseToNode.bind(this),
    RevitInstance: this.RevitInstanceToNode.bind(this)
  }

  constructor(objectLoader: unknown) {
    if (!objectLoader) {
      Logger.warn(
        'Converter initialized without a corresponding object loader. Any objects that include references will throw errors.'
      )
    }

    this.objectLoader = objectLoader

    this.lastAsyncPause = Date.now()
    this.activePromises = 0
    this.maxChildrenPromises = 200
    WorldTree.getInstance()
  }

  public async asyncPause() {
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
  public async traverse(
    objectURL: string,
    obj,
    callback: ConverterResultDelegate,
    node: TreeNode = null
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
          await this.traverse(objectURL, element, callback, node)
        } else {
          const childPromise = this.traverse(objectURL, element, callback, node)
          childrenConversionPromisses.push(childPromise)
        }
      }
      this.activePromises += childrenConversionPromisses.length
      await Promise.all(childrenConversionPromisses)
      this.activePromises -= childrenConversionPromisses.length
      return
    }

    const childNode: TreeNode = WorldTree.getInstance().parse({
      id: !node ? objectURL : this.getNodeId(obj),
      raw: Object.assign({}, obj),
      atomic: true,
      root: this.isRoot,
      children: []
    })
    this.isRoot = false

    if (node === null) {
      WorldTree.getInstance().addSubtree(childNode)
      // console.warn(`Added root node with id ${obj.id}`)
    } else {
      WorldTree.getInstance().addNode(childNode, node)
      // console.warn(`Added child node with id ${obj.id} to parent node ${node.model.id}`)
    }

    // If we can convert it, we should invoke the respective conversion routine.
    const type = this.getSpeckleType(obj)

    if (this.directNodeConverterExists(obj)) {
      try {
        await this.convertToNode(obj.data || obj, childNode)
        await callback(null /*await this.directConvert(obj.data || obj, scale)*/)
        return
      } catch (e) {
        Logger.warn(
          `(Traversing - direct) Failed to convert ${type} with id: ${obj.id}`,
          e
        )
      }
    }

    const target = obj //obj.data || obj

    // Check if the object has a display value of sorts
    let displayValue = this.getDisplayValue(target)

    if (displayValue) {
      childNode.model.atomic = true
    } else {
      childNode.model.atomic = false
    }

    if (displayValue) {
      if (!Array.isArray(displayValue)) {
        displayValue = await this.resolveReference(displayValue)
        if (!displayValue.units) displayValue.units = obj.units
        try {
          const nestedNode: TreeNode = WorldTree.getInstance().parse({
            id: this.getNodeId(displayValue),
            raw: Object.assign({}, displayValue),
            atomic: false,
            children: []
          })
          await this.convertToNode(displayValue, nestedNode)
          WorldTree.getInstance().addNode(nestedNode, childNode)
          await callback({}) // use the parent's metadata!
        } catch (e) {
          Logger.warn(
            `(Traversing) Failed to convert obj with id: ${obj.id} — ${e.message}`
          )
        }
      } else {
        for (const element of displayValue) {
          const val = await this.resolveReference(element)
          if (!val.units) val.units = obj.units
          const nestedNode: TreeNode = WorldTree.getInstance().parse({
            id: this.getNodeId(val),
            raw: Object.assign({}, val),
            atomic: false,
            children: []
          })
          await this.convertToNode(val, nestedNode)
          WorldTree.getInstance().addNode(nestedNode, childNode)
          await callback({})
        }
      }

      // If this is a built element and has a display value, only iterate through the "elements" prop if it exists.
      if (obj.speckle_type.toLowerCase().includes('builtelements')) {
        if (obj['elements']) {
          childrenConversionPromisses.push(
            this.traverse(objectURL, obj['elements'], callback, childNode)
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
      if (prop === '__parents' || prop === 'bbox' || prop === '__closure') continue
      if (
        ['displayMesh', '@displayMesh', 'displayValue', '@displayValue'].includes(prop)
      )
        continue
      if (typeof target[prop] !== 'object' || target[prop] === null) continue

      if (this.activePromises >= this.maxChildrenPromises) {
        await this.traverse(objectURL, target[prop], callback, childNode)
      } else {
        const childPromise = this.traverse(objectURL, target[prop], callback, childNode)
        childrenConversionPromisses.push(childPromise)
      }
    }
    this.activePromises += childrenConversionPromisses.length
    await Promise.all(childrenConversionPromisses)
    this.activePromises -= childrenConversionPromisses.length
  }

  private getNodeId(obj) {
    if (this.spoofIDs) return generateUUID()
    return obj.id
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

  private directNodeConverterExists(obj) {
    return this.getSpeckleType(obj) in this.NodeConverterMapping
  }

  private async convertToNode(obj, node) {
    if (obj.referencedId) obj = await this.resolveReference(obj)
    try {
      if (this.directNodeConverterExists(obj)) {
        return await this.NodeConverterMapping[this.getSpeckleType(obj)](obj, node)
      }
      return null
    } catch (e) {
      Logger.warn(`(Direct convert) Failed to convert object with id: ${obj.id}`)
      throw e
    }
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
   * 
    NODES
   */
  private async View3DToNode(obj, node) {
    obj.origin.units = obj.units
    obj.target.units = obj.units
  }

  private async BlockInstanceToNode(obj, node) {
    const definition = await this.resolveReference(obj.blockDefinition)
    node.model.raw.definition = definition
    for (const def of definition.geometry) {
      const ref = await this.resolveReference(def)
      const childNode: TreeNode = WorldTree.getInstance().parse({
        id: this.getNodeId(ref),
        raw: Object.assign({}, ref),
        atomic: true,
        children: []
      })
      WorldTree.getInstance().addNode(childNode, node)
      // console.warn(
      //   `Added child node with id ${childNode.model.id} to parent node ${node.model.id}`
      // )

      await this.convertToNode(ref, childNode)
    }
  }

  private async RevitInstanceToNode(obj, node) {
    const traverseList = async (list, hostId?: string) => {
      if (!list) return
      for (const def of list) {
        const ref = await this.resolveReference(def)
        const childNode: TreeNode = WorldTree.getInstance().parse({
          id: this.getNodeId(ref),
          raw: Object.assign({}, ref),
          atomic: true,
          children: []
        })
        if (hostId) {
          childNode.model.raw.host = hostId
        }
        WorldTree.getInstance().addNode(childNode, node)
        await this.convertToNode(ref, childNode)
      }
    }
    const definition = await this.resolveReference(obj.definition)
    node.model.raw.definition = definition

    await traverseList(definition.elements)
    await traverseList(definition.displayValue)
    await traverseList(obj.elements, obj.id)
  }

  private async PointcloudToNode(obj, node) {
    node.model.raw.points = await this.dechunk(obj.points)
    node.model.raw.colors = await this.dechunk(obj.colors)
  }

  private async BrepToNode(obj, node) {
    try {
      if (!obj) return

      let displayValue = obj.displayValue || obj.displayMesh
      if (Array.isArray(displayValue)) displayValue = displayValue[0] //Just take the first display value for now (not ideal)
      const ref = await this.resolveReference(displayValue)
      const nestedNode: TreeNode = WorldTree.getInstance().parse({
        id: this.getNodeId(ref),
        raw: Object.assign({}, ref),
        atomic: false,
        children: []
      })
      await this.convertToNode(ref, nestedNode)
      WorldTree.getInstance().addNode(nestedNode, node)

      // deletes known unneeded fields
      delete obj.Edges
      delete obj.Faces
      delete obj.Loops
      delete obj.Trims
      delete obj.Curve2D
      delete obj.Curve3D
      delete obj.Surfaces
      delete obj.Vertices
    } catch (e) {
      Logger.warn(`Failed to convert brep id: ${obj.id}`)
      throw e
    }
  }

  private async MeshToNode(obj, node) {
    if (!obj) return
    if (!obj.vertices || obj.vertices.length === 0) {
      Logger.warn(
        `Object id ${obj.id} of type ${obj.speckle_type} has no vertex position data and will be ignored`
      )
      return
    }
    if (!obj.faces || obj.faces.length === 0) {
      Logger.warn(
        `Object id ${obj.id} of type ${obj.speckle_type} has no face data and will be ignored`
      )
      return
    }

    node.model.raw.vertices = await this.dechunk(obj.vertices)
    node.model.raw.faces = await this.dechunk(obj.faces)
    node.model.raw.colors = await this.dechunk(obj.colors)
  }

  private async PointToNode(obj, node) {
    return
  }
  private async LineToNode(obj, node) {
    return
  }

  private async PolylineToNode(obj, node) {
    node.model.raw.value = await this.dechunk(obj.value)
  }

  private async BoxToNode(obj, node) {
    return
  }

  private async PolycurveToNode(obj, node) {
    node.model.nestedNodes = []
    for (let i = 0; i < obj.segments.length; i++) {
      let element = obj.segments[i]
      /** Not a big fan of this... */
      if (!this.directNodeConverterExists(element)) {
        element = this.getDisplayValue(element)
        if (element.referencedId) {
          element = await this.resolveReference(element)
        }
      }
      const nestedNode: TreeNode = WorldTree.getInstance().parse({
        id: this.getNodeId(element),
        raw: Object.assign({}, element),
        atomic: false,
        children: []
      })
      await this.convertToNode(element, nestedNode)
      /** We're not adding the segments as children since they shouldn't exist as individual line elements */
      node.model.nestedNodes.push(nestedNode)
      // WorldTree.getInstance().addNode(nestedNode, node)
    }
  }

  private async CurveToNode(obj, node) {
    if (!obj.displayValue) {
      Logger.warn(
        `Object ${obj.id} of type ${obj.speckle_type} has no display value and will be ignored`
      )
      return
    }
    const displayValue = await this.resolveReference(obj.displayValue)
    displayValue.units = displayValue.units || obj.units
    const nestedNode: TreeNode = WorldTree.getInstance().parse({
      id: this.getNodeId(displayValue),
      raw: Object.assign({}, displayValue),
      atomic: false,
      children: []
    })
    await this.convertToNode(displayValue, nestedNode)
    WorldTree.getInstance().addNode(nestedNode, node)
  }

  private async CircleToNode(obj, node) {
    return
  }

  private async ArcToNode(obj, node) {
    return
  }

  private async EllipseToNode(obj, node) {
    return
  }
}
