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
  private tree: WorldTree

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
    RevitInstance: this.RevitInstanceToNode.bind(this),
    Text: this.TextToNode.bind(this),
    Dimension: this.DimensionToNode.bind(this)
  }

  constructor(objectLoader: unknown, tree: WorldTree) {
    if (!objectLoader) {
      Logger.warn(
        'Converter initialized without a corresponding object loader. Any objects that include references will throw errors.'
      )
    }

    this.objectLoader = objectLoader
    this.lastAsyncPause = Date.now()
    this.activePromises = 0
    this.maxChildrenPromises = 200
    this.tree = tree
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

    const childNode: TreeNode = this.tree.parse({
      id: !node ? objectURL : this.getNodeId(obj),
      raw: Object.assign({}, obj),
      atomic: true,
      children: []
    })

    if (node === null) {
      this.tree.addSubtree(childNode)
      // console.warn(`Added root node with id ${obj.id}`)
    } else {
      this.tree.addNode(childNode, node)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let displayValue = this.getDisplayValue(target) as any

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
          const nestedNode: TreeNode = this.tree.parse({
            id: this.getNodeId(displayValue),
            raw: Object.assign({}, displayValue),
            atomic: false,
            children: []
          })
          await this.convertToNode(displayValue, nestedNode)
          this.tree.addNode(nestedNode, childNode)
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
          const nestedNode: TreeNode = this.tree.parse({
            id: this.getNodeId(val),
            raw: Object.assign({}, val),
            atomic: false,
            children: []
          })
          await this.convertToNode(val, nestedNode)
          this.tree.addNode(nestedNode, childNode)
          await callback({})
        }
      }

      // If this is a built element and has a display value, only iterate through the "elements" prop if it exists.
      if (obj.speckle_type.toLowerCase().includes('builtelements')) {
        const elements = this.getElementsValue(obj)
        if (elements) {
          childrenConversionPromisses.push(
            this.traverse(objectURL, elements, callback, childNode)
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
    const typeChain = this.getSpeckleTypeChain(obj)
    for (const type of typeChain) {
      const nodeConverter = type in this.NodeConverterMapping
      if (nodeConverter) return type
    }
    return 'Base'
  }

  private getSpeckleTypeChain(obj): string[] {
    let type = ['Base']
    if (obj.data)
      type = obj.data.speckle_type ? obj.data.speckle_type.split(':').reverse() : type
    else type = obj.speckle_type ? obj.speckle_type.split(':').reverse() : type
    return type.map<string>((value: string) => {
      return value.split('.').reverse()[0]
    })
  }

  private directNodeConverterExists(obj) {
    const typeChain = this.getSpeckleTypeChain(obj)
    for (const type of typeChain) {
      const nodeConverter = type in this.NodeConverterMapping
      if (nodeConverter) return nodeConverter
    }
    return false
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
    const displayValue =
      obj['displayValue'] ||
      obj['@displayValue'] ||
      obj['displayMesh'] ||
      obj['@displayMesh']

    if (displayValue) {
      if (Array.isArray(displayValue)) {
        const filteredDisplayValue = displayValue.filter((v) => v)
        if (displayValue.length !== filteredDisplayValue.length) {
          Logger.warn(`Object ${obj.id} has null display values which will be ignored`)
        }
        return filteredDisplayValue
      }
      return displayValue
    }
    return null
  }

  private getElementsValue(obj) {
    return obj['elements'] || obj['@elements']
  }

  private getBlockDefinition(obj) {
    return (
      obj['@blockDefinition'] ||
      obj['blockDefinition'] ||
      obj['definition'] ||
      obj['@definition']
    )
  }

  private getBlockDefinitionGeometry(obj) {
    return obj['@geometry'] || obj['geometry']
  }

  /**
   * 
    NODES
   */
  private async View3DToNode(obj, node) {
    obj.origin.units = obj.units
    obj.target.units = obj.units
  }

  // private hashCode = (input: string) => {
  //   let hash = 0,
  //     i,
  //     chr
  //   if (input.length === 0) return hash
  //   for (i = 0; i < input.length; i++) {
  //     chr = input.charCodeAt(i)
  //     hash = (hash << 5) - hash + chr
  //     hash |= 0 // Convert to 32bit integer
  //   }
  //   return hash
  // }

  // private hashCode = (input: string) => {
  //   let hash = 0,
  //     i,
  //     chr
  //   if (input.length === 0) return hash
  //   for (i = 0; i < input.length; i++) {
  //     chr = input.charCodeAt(i)
  //     hash = (hash << 5) - hash + chr
  //     hash |= 0 // Convert to 32bit integer
  //   }
  //   return hash
  // }

  /** This is only used for Blocks to search for convertible objects, without using the main 'traverse' function
   *  It's only looking for 'elements' and 'displayValues'
   *  I think it can be used for RevitInstances as well to replace it's current lookup, but I'm afraid to do it
   */
  private async displayableLookup(obj, node) {
    if (this.directNodeConverterExists(obj)) {
      await this.convertToNode(obj, node)
    } else {
      const displayValues = this.getDisplayValue(obj)
      const elements = this.getElementsValue(obj)
      const entries = [
        ...(displayValues ? displayValues : []),
        ...(elements ? elements : [])
      ]
      for (const entry of entries) {
        const value = await this.resolveReference(entry)
        const valueNode: TreeNode = this.tree.parse({
          id: this.getNodeId(value),
          raw: Object.assign({}, value),
          atomic: false,
          children: []
        })
        this.tree.addNode(valueNode, node)
        await this.displayableLookup(value, valueNode)
      }
    }
  }

  private async BlockInstanceToNode(obj, node) {
    const definition = await this.resolveReference(this.getBlockDefinition(obj))
    node.model.raw.definition = definition
    for (const def of this.getBlockDefinitionGeometry(definition)) {
      const ref = await this.resolveReference(def)
      ref.id = ref.id + node.model.raw.transform.id
      const childNode: TreeNode = this.tree.parse({
        id: this.getNodeId(ref),
        raw: Object.assign({}, ref),
        atomic: false,
        children: []
      })
      this.tree.addNode(childNode, node)

      await this.displayableLookup(ref, childNode)
      const elements = this.getElementsValue(obj)
      if (elements) {
        for (const element of elements) {
          const ref = await this.resolveReference(element)
          const childNode: TreeNode = this.tree.parse({
            id: this.getNodeId(ref),
            raw: Object.assign({}, ref),
            atomic: false,
            children: []
          })
          childNode.model.raw.host = obj.id
          this.tree.addNode(childNode, node)
          await this.displayableLookup(ref, childNode)
        }
      }
    }
  }

  private async RevitInstanceToNode(obj, node) {
    const traverseList = async (list, hostId?: string) => {
      if (!list) return
      for (const def of list) {
        const ref = await this.resolveReference(def)
        const childNode: TreeNode = this.tree.parse({
          id: this.getNodeId(ref),
          raw: Object.assign({}, ref),
          atomic: false,
          children: []
        })
        if (hostId) {
          childNode.model.raw.host = hostId
        }
        this.tree.addNode(childNode, node)
        await this.convertToNode(ref, childNode)
      }
    }
    const definition = await this.resolveReference(obj.definition)
    node.model.raw.definition = definition

    await traverseList(this.getElementsValue(definition))
    await traverseList(this.getDisplayValue(definition))
    await traverseList(this.getElementsValue(obj), obj.id)
  }

  private async PointcloudToNode(obj, node) {
    node.model.raw.points = await this.dechunk(obj.points)
    node.model.raw.colors = await this.dechunk(obj.colors)
  }

  private async BrepToNode(obj, node) {
    try {
      if (!obj) return

      let displayValue = this.getDisplayValue(obj)

      if (Array.isArray(displayValue)) displayValue = displayValue[0] //Just take the first display value for now (not ideal)
      if (!displayValue) return

      const ref = await this.resolveReference(displayValue)
      const nestedNode: TreeNode = this.tree.parse({
        id: this.getNodeId(ref),
        raw: Object.assign({}, ref),
        atomic: false,
        children: []
      })
      await this.convertToNode(ref, nestedNode)
      this.tree.addNode(nestedNode, node)

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

  private async TextToNode(obj, node) {
    return
  }

  private async DimensionToNode(obj, node) {
    const displayValues = [...this.getDisplayValue(obj)]
    for (const displayValue of displayValues) {
      const childNode: TreeNode = this.tree.parse({
        id: this.getNodeId(displayValue),
        raw: Object.assign({}, displayValue),
        atomic: false,
        children: []
      })
      this.tree.addNode(childNode, node)
      await this.convertToNode(displayValue, childNode)
    }
    /**
     * YOLO
     * - Dimensions of all types do not have information about text size
     * - Positioning of the text is not consistent across dimension types
     * - Angular Dimensions are broken
     */
    const textObj = JSON.parse(JSON.stringify(obj))
    textObj.plane = textObj.RhinoProps.plane
    const derivedType = this.getSpeckleTypeChain(textObj)[0]
    switch (derivedType) {
      case 'LengthDimension':
        textObj.plane.origin = textObj.position
        break
      case 'DistanceDimension':
        textObj.plane.origin = textObj.textPosition
        break
      case 'AngleDimension':
        textObj.plane.origin = textObj.textPosition
        break
    }
    textObj['speckle_type'] = 'Objects.Other.Text'
    const textNode: TreeNode = this.tree.parse({
      id: this.getNodeId(textObj),
      raw: textObj,
      atomic: false,
      children: []
    })
    this.tree.addNode(textNode, node)
    await this.convertToNode(textObj, textNode)
  }

  private async PointToNode(obj, node) {
    return
  }
  private async LineToNode(obj, node) {
    node.model.raw.start = Object.assign({}, obj.start)
    node.model.raw.end = Object.assign({}, obj.end)
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
      const nestedNode: TreeNode = this.tree.parse({
        id: this.getNodeId(element),
        raw: Object.assign({}, element),
        atomic: false,
        children: []
      })
      await this.convertToNode(element, nestedNode)
      /** We're not adding the segments as children since they shouldn't exist as individual line elements */
      node.model.nestedNodes.push(nestedNode)
      // WorldTree.getInstance(this.treeInstaceId).addNode(nestedNode, node)
    }
  }

  private async CurveToNode(obj, node) {
    let displayValue = this.getDisplayValue(obj)
    if (!displayValue) {
      Logger.warn(
        `Object ${obj.id} of type ${obj.speckle_type} has no display value and will be ignored`
      )
      return
    }
    node.model.nestedNodes = []
    displayValue = await this.resolveReference(obj.displayValue)
    displayValue.units = displayValue.units || obj.units
    const nestedNode: TreeNode = this.tree.parse({
      id: this.getNodeId(displayValue),
      raw: Object.assign({}, displayValue),
      atomic: false,
      children: []
    })
    await this.convertToNode(displayValue, nestedNode)
    /** We're not adding the segments as children since they shouldn't exist as individual line elements */
    node.model.nestedNodes.push(nestedNode)
    // this.tree.addNode(nestedNode, node)
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
