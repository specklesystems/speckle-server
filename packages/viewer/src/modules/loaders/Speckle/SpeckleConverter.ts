/* eslint-disable @typescript-eslint/no-unused-vars */
import { MathUtils, Matrix4 } from 'three'
import { type TreeNode, WorldTree } from '../../tree/WorldTree.js'
import { NodeMap } from '../../tree/NodeMap.js'
import { SpeckleType, type SpeckleObject } from '../../../index.js'
import type ObjectLoader from '@speckle/objectloader'
import Logger from '../../utils/Logger.js'

export type ConverterResultDelegate = () => Promise<void>
export type SpeckleConverterNodeDelegate =
  | ((object: SpeckleObject, node: TreeNode) => Promise<void>)
  | null

/**
 * Utility class providing some top level conversion methods.
 * Warning: HIC SVNT DRACONES.
 */
export default class SpeckleConverter {
  protected objectLoader: ObjectLoader
  protected activePromises: number
  protected maxChildrenPromises: number
  protected spoofIDs = false
  protected tree: WorldTree
  protected subtree: TreeNode
  protected typeLookupTable: { [type: string]: string } = {}
  protected instanceDefinitionLookupTable: { [id: string]: TreeNode } = {}
  protected instancedObjectsLookupTable: { [id: string]: SpeckleObject } = {}
  protected instanceProxies: { [id: string]: TreeNode } = {}
  protected renderMaterialMap: { [id: string]: SpeckleObject } = {}
  protected colorMap: { [id: string]: SpeckleObject } = {}
  protected instanceCounter = 0

  protected readonly NodeConverterMapping: {
    [name: string]: SpeckleConverterNodeDelegate
  } = {
    View3D: this.View3DToNode.bind(this),
    BlockInstance: this.BlockInstanceToNode.bind(this),
    Pointcloud: this.PointcloudToNode.bind(this),
    Brep: this.BrepToNode.bind(this),
    BrepX: this.BrepToNode.bind(this),
    ExtrusionX: this.BrepToNode.bind(this),
    SubDX: this.BrepToNode.bind(this),
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
    Dimension: this.DimensionToNode.bind(this),
    InstanceDefinitionProxy: this.InstanceDefinitionProxyToNode.bind(this),
    InstanceProxy: this.InstanceProxyToNode.bind(this),
    RenderMaterialProxy: this.RenderMaterialProxyToNode.bind(this),
    ColorProxy: this.ColorProxyToNode.bind(this),
    Parameter: null
  }

  protected readonly IgnoreNodes = ['Parameter']

  constructor(objectLoader: ObjectLoader, tree: WorldTree) {
    if (!objectLoader) {
      Logger.warn(
        'Converter initialized without a corresponding object loader. Any objects that include references will throw errors.'
      )
    }

    this.objectLoader = objectLoader
    this.activePromises = 0
    this.maxChildrenPromises = 200
    this.tree = tree
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
    obj: SpeckleObject,
    callback: ConverterResultDelegate,
    node: TreeNode | null = null
  ) {
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

    /** These are not needed as nodes */
    if (this.IgnoreNodes.includes(this.getSpeckleType(obj))) {
      return
    }
    /** Ignore objects with no id */
    if (!obj.id) return

    const childNode: TreeNode = this.tree.parse({
      id: this.getNodeId(obj),
      raw: obj,
      atomic: true,
      children: []
    })

    if (node === null) {
      /** We're adding a parent for the entire model (subtree) */
      this.subtree = this.tree.parse({
        id: objectURL,
        /* Hack required by frontend*/
        raw: { id: objectURL, children: [obj] },
        atomic: true,
        children: []
      })
      this.tree.addSubtree(this.subtree)
      this.tree.addNode(childNode, this.subtree)
    } else {
      this.tree.addNode(childNode, node)
    }

    // If we can convert it, we should invoke the respective conversion routine.
    if (this.directNodeConverterExists(obj)) {
      try {
        await this.convertToNode(obj, childNode)
        await callback()
        return
      } catch (e) {
        Logger.warn(
          `(Traversing - direct) Failed to convert ${this.getSpeckleType(
            obj
          )} with id: ${obj.id}`,
          e
        )
      }
    }

    const target: SpeckleObject = obj

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
            raw: displayValue,
            atomic: false,
            children: []
          })
          this.tree.addNode(nestedNode, childNode)
          await this.convertToNode(displayValue, nestedNode)
          await callback()
        } catch (e) {
          Logger.warn(
            `(Traversing) Failed to convert obj with id: ${obj.id} — ${
              (e as never)['message']
            }`
          )
        }
      } else {
        for (const element of displayValue) {
          const val = await this.resolveReference(element)
          if (!val.units) val.units = obj.units
          const nestedNode: TreeNode = this.tree.parse({
            id: this.getNodeId(val),
            raw: val,
            atomic: false,
            children: []
          })
          this.tree.addNode(nestedNode, childNode)
          await this.convertToNode(val, nestedNode)
          await callback()
        }
      }

      // If this is a built element and has a display value, only iterate through the "elements" prop if it exists.
      /** 10.25.2023 This might be serious legacy stuff that we might not need anymore */
      /** 22.11.2024 We have just added stuff to this serious legacy stuff that might not be needed anymore (joke's on us, it is needed) */
      if (
        obj.speckle_type.toLowerCase().includes('builtelements') ||
        obj.speckle_type.toLowerCase().includes('objects.data')
      ) {
        const elements = this.getElementsValue(obj)
        if (elements) {
          childrenConversionPromisses.push(
            this.traverse(objectURL, elements as SpeckleObject, callback, childNode)
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
        await this.traverse(
          objectURL,
          target[prop] as SpeckleObject,
          callback,
          childNode
        )
      } else {
        const childPromise = this.traverse(
          objectURL,
          target[prop] as SpeckleObject,
          callback,
          childNode
        )
        childrenConversionPromisses.push(childPromise)
      }
    }
    this.activePromises += childrenConversionPromisses.length
    await Promise.all(childrenConversionPromisses)
    this.activePromises -= childrenConversionPromisses.length
  }

  private getNodeId(obj: SpeckleObject): string {
    if (this.spoofIDs) return MathUtils.generateUUID()
    return obj.id
  }

  /**
   * Takes an array composed of chunked references and dechunks it.
   * @param  {[type]} arr [description]
   * @return {[type]}     [description]
   */
  private async dechunk(arr: Array<{ referencedId: string }>) {
    if (!arr || arr.length === 0) return arr
    // Handles pre-chunking objects, or arrs that have not been chunked
    if (!arr[0].referencedId) return arr

    const chunked: unknown[] = []
    for (const ref of arr) {
      const real: Record<string, unknown> = await this.objectLoader.getObject(
        ref.referencedId
      )
      chunked.push(real.data)
      // await this.asyncPause()
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dechunked = [].concat(...(chunked as any))

    return dechunked
  }

  /**
   * Resolves an object reference by waiting for the loader to load it up.
   * @param  {[type]} obj [description]
   * @return {[type]}     [description]
   */
  private async resolveReference(obj: SpeckleObject): Promise<SpeckleObject> {
    if (obj.referencedId) {
      const resolvedObj = (await this.objectLoader.getObject(
        obj.referencedId
      )) as SpeckleObject
      // this.asyncPause()
      return resolvedObj
    } else return obj
  }

  /**
   * Gets the speckle type of an object in various scenarios.
   * @param  {[type]} obj [description]
   * @return {[type]}     [description]
   */
  private getSpeckleType(obj: SpeckleObject): string {
    const rawType = obj.speckle_type ? obj.speckle_type : 'Base'

    const lookup = this.typeLookupTable[rawType]
    if (lookup) return lookup

    let typeRet = 'Base'
    const typeChain = this.getSpeckleTypeChain(obj)
    for (const type of typeChain) {
      const nodeConverter = type in this.NodeConverterMapping
      if (nodeConverter) {
        typeRet = type
        break
      }
    }
    this.typeLookupTable[rawType] = typeRet
    return typeRet
  }

  private getSpeckleTypeChain(obj: SpeckleObject): string[] {
    let type = ['Base']
    type = obj.speckle_type ? obj.speckle_type.split(':').reverse() : type
    type = type.map<string>((value: string) => {
      return value.split('.').reverse()[0]
    })

    return type
  }

  private directNodeConverterExists(obj: SpeckleObject) {
    return this.getSpeckleType(obj) in this.NodeConverterMapping
  }

  private async convertToNode(obj: SpeckleObject, node: TreeNode) {
    if (obj.referencedId) obj = await this.resolveReference(obj)
    try {
      if (this.directNodeConverterExists(obj)) {
        const delegate = this.NodeConverterMapping[this.getSpeckleType(obj)]
        if (delegate) return await delegate(obj, node)
      }
      return null
    } catch (e) {
      Logger.warn(`(Direct convert) Failed to convert object with id: ${obj.id}`)
      throw e
    }
  }

  private getDisplayValue(obj: SpeckleObject) {
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

  private getElementsValue(obj: SpeckleObject) {
    return obj['elements'] || obj['@elements']
  }

  private getBlockDefinition(obj: SpeckleObject) {
    return (
      obj['@blockDefinition'] ||
      obj['blockDefinition'] ||
      obj['definition'] ||
      obj['@definition']
    )
  }

  private getBlockDefinitionGeometry(obj: SpeckleObject) {
    return obj['@geometry'] || obj['geometry']
  }

  /** We're wasting a few milis here, but it is what it is */
  private getCompoundId(baseId: string, counter: number) {
    const index = baseId.indexOf(NodeMap.COMPOUND_ID_CHAR)
    if (index === -1) {
      return baseId + NodeMap.COMPOUND_ID_CHAR + counter
    }
    return baseId.substring(0, index) + NodeMap.COMPOUND_ID_CHAR + counter
  }

  private getEmptyTransformData(id: string) {
    // eslint-disable-next-line camelcase
    return { id, speckle_type: 'Transform', units: 'm', matrix: new Array(16) }
  }

  /**
   * 
    NODES
   */
  private async View3DToNode(obj: SpeckleObject, _node: TreeNode) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    obj.origin.units = obj.units
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    obj.target.units = obj.units
  }

  /** This is only used for Blocks to search for convertible objects, without using the main 'traverse' function
   *  It's only looking for 'elements' and 'displayValues'
   *  I think it can be used for RevitInstances as well to replace it's current lookup, but I'm afraid to do it
   */
  private async displayableLookup(
    obj: SpeckleObject,
    node: TreeNode,
    instanced: boolean
  ) {
    if (this.directNodeConverterExists(obj)) {
      await this.convertToNode(obj, node)
    } else {
      const displayValues = this.getDisplayValue(obj)
      const elements = this.getElementsValue(obj)
      const entries = [
        ...(displayValues ? (displayValues as SpeckleObject[]) : []),
        ...(elements ? (elements as SpeckleObject[]) : [])
      ]
      for (const entry of entries) {
        const value = await this.resolveReference(entry)
        const valueNode: TreeNode = this.tree.parse({
          id: this.getCompoundId(value.id, this.instanceCounter++),
          raw: value,
          atomic: false,
          children: [],
          instanced
        })

        this.tree.addNode(valueNode, node)
        await this.displayableLookup(value, valueNode, instanced)
      }
    }
  }

  private async parseInstanceDefinitionGeometry(
    instanceObj: SpeckleObject,
    defGeometry: SpeckleObject,
    instanceNode: TreeNode
  ) {
    const transformNodeId = MathUtils.generateUUID()
    let transformData = null
    /** Legacy form of Transform */
    if (Array.isArray(instanceObj.transform)) {
      transformData = this.getEmptyTransformData(transformNodeId)
      transformData.units = instanceObj.units as string
      transformData.matrix = instanceObj.transform
    } else {
      transformData = instanceObj.transform
        ? instanceObj.transform
        : this.getEmptyTransformData(transformNodeId)
    }
    const transformNode = this.tree.parse({
      id: transformNodeId,
      raw: transformData,
      atomic: false,
      children: []
    })
    this.tree.addNode(transformNode, instanceNode)

    const childNode: TreeNode = this.tree.parse({
      id: this.getCompoundId(defGeometry.id, this.instanceCounter++),
      raw: defGeometry,
      atomic: false,
      children: [],
      instanced: true
    })
    this.tree.addNode(childNode, transformNode)

    await this.displayableLookup(defGeometry, childNode, true)
  }

  private async parseInstanceElement(
    _instanceObj: SpeckleObject,
    elementObj: SpeckleObject,
    instanceNode: TreeNode
  ) {
    const childNode: TreeNode = this.tree.parse({
      id: this.getNodeId(elementObj),
      raw: elementObj,
      atomic: false,
      children: []
    })
    this.tree.addNode(childNode, instanceNode)
    await this.displayableLookup(elementObj, childNode, false)
  }

  private async BlockInstanceToNode(obj: SpeckleObject, node: TreeNode) {
    const definition: SpeckleObject = await this.resolveReference(
      this.getBlockDefinition(obj) as SpeckleObject
    )
    node.model.raw.definition = definition
    for (const def of this.getBlockDefinitionGeometry(definition) as SpeckleObject[]) {
      const ref = await this.resolveReference(def)
      await this.parseInstanceDefinitionGeometry(obj, ref, node)
    }

    const elements = this.getElementsValue(obj)
    if (elements) {
      for (const element of elements as SpeckleObject[]) {
        const elementObj = await this.resolveReference(element)
        void this.parseInstanceElement(obj, elementObj, node)
      }
    }
  }

  private async RevitInstanceToNode(obj: SpeckleObject, node: TreeNode) {
    const definition = await this.resolveReference(obj.definition as SpeckleObject)
    node.model.raw.definition = definition
    await this.parseInstanceDefinitionGeometry(obj, definition, node)

    const elements = this.getElementsValue(obj)
    if (elements) {
      for (const element of elements as SpeckleObject[]) {
        const elementObj = await this.resolveReference(element)
        void this.parseInstanceElement(obj, elementObj, node)
      }
    }
  }

  private async InstanceDefinitionProxyToNode(obj: SpeckleObject, node: TreeNode) {
    if (!obj.applicationId) {
      Logger.warn(`Instance Definition Proxy ${obj.id} has no applicationId`)
      return
    }
    this.instanceDefinitionLookupTable[obj.applicationId] = node
  }

  private async InstanceProxyToNode(obj: SpeckleObject, node: TreeNode) {
    if (!obj.applicationId) {
      Logger.warn(`Instance proxy ${obj.id} has no application id`)
      return
    }
    this.instanceProxies[obj.applicationId] = node
    return
  }

  private async RenderMaterialProxyToNode(obj: SpeckleObject, _node: TreeNode) {
    if (!obj.value) {
      Logger.error(`Render Material Proxy ${obj.id} has no render material value!`)
      return
    }
    if (!obj.objects || !Array.isArray(obj.objects) || obj.objects.length === 0) {
      Logger.warn(`Render Material Proxy ${obj.id} has no target objects!`)
    }
    const renderMaterialValue = obj.value as SpeckleObject
    const targetObjects = obj.objects as []
    for (let k = 0; k < targetObjects.length; k++) {
      if (this.renderMaterialMap[targetObjects[k]]) {
        Logger.error(`Overwritting renderMaterial ${targetObjects[k]}`)
      }
      this.renderMaterialMap[targetObjects[k]] = renderMaterialValue
    }
  }

  private async ColorProxyToNode(obj: SpeckleObject, _node: TreeNode) {
    if (!obj.value || typeof obj.value !== 'number') {
      Logger.error(`Color ${obj.id} has no value, or value is not a number!`)
      return
    }
    if (!obj.objects || !Array.isArray(obj.objects) || obj.objects.length === 0) {
      Logger.warn(`Color Proxy ${obj.id} has no target objects!`)
      return
    }
    const targetObjects = obj.objects as []
    for (let k = 0; k < targetObjects.length; k++) {
      if (this.colorMap[targetObjects[k]]) {
        Logger.error(`Overwritting color ${targetObjects[k]}`)
      }
      this.colorMap[targetObjects[k]] = obj
    }
  }

  private getInstanceProxyDefinitionId(obj: SpeckleObject): string {
    return (obj.DefinitionId || obj.definitionId) as string
  }

  private getInstanceProxyTransform(obj: SpeckleObject): Array<number> {
    if (!(obj.transform || obj.Transform)) {
      return new Matrix4().toArray()
    }
    return (obj.transform || obj.Transform) as Array<number>
  }

  private getInstanceProxyDefinitionObjects(obj: SpeckleObject): Array<string> {
    return (obj.Objects || obj.objects) as Array<string>
  }

  private createTransformNode(obj: SpeckleObject) {
    const transformNodeId = MathUtils.generateUUID()
    const transformData = this.getEmptyTransformData(transformNodeId)
    transformData.units = obj.units as string
    transformData.matrix = this.getInstanceProxyTransform(obj)
    return this.tree.parse({
      id: transformNodeId,
      raw: transformData,
      atomic: false,
      children: []
    })
  }

  private async ConvertInstanceProxyToNode(obj: SpeckleObject, node: TreeNode) {
    const definitionId = this.getInstanceProxyDefinitionId(obj)
    if (!definitionId) {
      Logger.warn(`Instance Proxy ${obj.id} has no definitionId`)
      return
    }
    const definition = this.instanceDefinitionLookupTable[definitionId]
    const transformNode = this.createTransformNode(obj)

    this.tree.addNode(transformNode, node)
    const objectApplicationIds = this.getInstanceProxyDefinitionObjects(
      definition.model.raw
    )
    for (const objectApplicationId of objectApplicationIds) {
      const speckleData = this.instancedObjectsLookupTable[objectApplicationId]
      // NOTE: see https://linear.app/speckle/issue/CNX-115/viewer-handle-gracefully-instances-with-elements-that-failed-to
      // This prevents the viewer not loading anything if a instance component is missing from its defintion. This is a likely scenario from connectors; even though we're guarding against it we'll never be able to fully enforce it.
      if (!speckleData) {
        Logger.warn(
          `Object ${objectApplicationId} is is missing from definition ${definitionId}. Someone probably sent an instance containing unsopprted elements - this is ok, do not panic.`
        )
        continue
      }
      const instancedNode = this.tree.parse({
        id: this.getCompoundId(speckleData.id, this.instanceCounter++),
        raw: speckleData,
        atomic: false,
        children: [],
        instanced: true
      })
      this.tree.addNode(instancedNode, transformNode)
      await this.convertToNode(speckleData, instancedNode)
    }
  }

  public async convertInstances() {
    /** uh, oh */
    this.NodeConverterMapping.InstanceProxy = this.ConvertInstanceProxyToNode.bind(this)

    /** Find the nodes that need to be 'consumed' */
    const consumeApplicationIds: { [id: string]: TreeNode | null } = {}
    let consumeApplicationIdsCount = 0
    for (const k in this.instanceDefinitionLookupTable) {
      const definition = this.instanceDefinitionLookupTable[k]
      const objects = this.getInstanceProxyDefinitionObjects(definition.model.raw)
      for (let i = 0; i < objects.length; i++) {
        consumeApplicationIds[objects[i].toString()] = null
        consumeApplicationIdsCount++
      }
    }

    /** Do a short async walk */
    await this.tree.walkAsync((node: TreeNode) => {
      if (!node.model.raw.applicationId) return true
      const applicationId = node.model.raw.applicationId.toString()
      if (consumeApplicationIds[applicationId] !== undefined) {
        consumeApplicationIds[applicationId] = node
        consumeApplicationIdsCount--
      }
      /** Break out when all applicationIds are accounted for*/
      if (consumeApplicationIdsCount === 0) return false
      return true
    }, this.subtree)

    /** Consume them */
    for (const k in consumeApplicationIds) {
      const objectNode = consumeApplicationIds[k]
      if (!objectNode) {
        Logger.error(`Consumable applicationId ${k} could not be found`)
        continue
      }

      /** Store the speckle object data */
      this.instancedObjectsLookupTable[k] = objectNode.model.raw
      /** This part is catering to color proxies source and
       *  I hate this the most
       *  We store the definition geometry (which can be an instance if nested) parent layer color
       *  We do that because these get consumed, so they can no longer be accessed via the WorldTree
       */
      if (!this.instanceProxies[k]) {
        this.instancedObjectsLookupTable[k].parentLayerApplicationId =
          objectNode.parent.model.raw.applicationId
      } else {
        const definitionId = this.instanceProxies[k].model.raw.definitionId
        const proxies = Object.values(this.instanceProxies)
        proxies.forEach((value: TreeNode) => {
          if (value.model.raw.definitionId === definitionId) {
            value.model.raw.parentLayerApplicationId =
              value.parent.model.raw.applicationId
          }
        })
      }
      /** Remove the instance from the list (if needed) */
      delete this.instanceProxies[k]
      /** Remove the node from the world tree */
      this.tree.removeNode(objectNode, true)
    }

    let count = 0
    /** Remaining instance proxies should all be valid */
    for (const k in this.instanceProxies) {
      const node = this.instanceProxies[k]
      /** Create the final instances */
      await this.convertToNode(node.model.raw, node)
      count++
      // if (count === 3) break
    }
  }

  public async applyMaterials() {
    let renderMaterialCount = Object.keys(this.renderMaterialMap).length
    let colorCount = Object.keys(this.colorMap).length
    if (renderMaterialCount === 0 && colorCount === 0) return

    /** Do a short async walk */
    await this.tree.walkAsync((node: TreeNode) => {
      if (!node.model.raw.applicationId) return true
      const applicationId = node.model.raw.applicationId.toString()
      if (this.renderMaterialMap[applicationId] !== undefined) {
        node.model.raw.renderMaterial = this.renderMaterialMap[applicationId]
        renderMaterialCount--
      }

      /** For non-instanced objects just use the color if any is present */
      if (this.colorMap[applicationId] !== undefined && !node.model.instanced) {
        node.model.color = this.colorMap[applicationId].value
        colorCount--
      }
      /** Break out when all applicationIds are accounted for*/
      if (renderMaterialCount === 0 && colorCount === 0) return false
      return true
    }, this.subtree)

    /** For instances, we need some additional parsing */
    for (const k in this.instanceProxies) {
      /** Find the maxDepth. This is weird because the InstanceProxy's `maxDepth` is more
       *  like an `inverseMaxDepth`
       */
      const maxDepth = this.tree
        .findAll(
          (node: TreeNode) =>
            this.getSpeckleType(node.model.raw) === SpeckleType.InstanceProxy,
          this.instanceProxies[k]
        )
        .reduce((prev, current) =>
          prev && prev.model.raw.maxDepth > current.model.raw.maxDepth ? prev : current
        ).model.raw.maxDepth
      /** Get all the leaf InstanceProxy nodes. There might be nested instances
       *  bu we want the leaf ones
       */
      const instanceProxyNodes = this.tree.findAll(
        (node: TreeNode) => node.model.raw.maxDepth === maxDepth,
        this.instanceProxies[k]
      )
      /** Go over them */
      for (let i = 0; i < instanceProxyNodes.length; i++) {
        /** Get the color of the instance.
         *  Or it's definition geometry's layer color  */
        const instanceColor =
          this.colorMap[instanceProxyNodes[i].model.raw.applicationId] ||
          this.colorMap[instanceProxyNodes[i].model.raw.parentLayerApplicationId]
        /** Get the geometry nodes */
        const instancedNodes = instanceProxyNodes[i].children[0].children
        for (let j = 0; j < instancedNodes.length; j++) {
          /** Get the geometry definition's color
           *  In the viewer the geometry definition is stored and shared across potential instances
           *  as the speckle object in `raw`
           */
          const geometryColor = this.colorMap[instancedNodes[j].model.raw.applicationId]
          /** Get the definition geometry's layer color */
          const geometryLayerColor =
            this.colorMap[instancedNodes[j].model.raw.parentLayerApplicationId]
          /** If definition geometry has no color, use it's layer color */
          if (!geometryColor) {
            instancedNodes[j].model.color = geometryLayerColor?.value
            /** If definition geometry color source is object or layer use the definition's color */
          } else if (
            geometryColor.source === 'object' ||
            geometryColor.source === 'layer'
          ) {
            instancedNodes[j].model.color = geometryColor.value
            /** If definition geometry color source is block, we need some extra stuff */
          } else if (geometryColor.source === 'block') {
            /** If there is an color for the instance and the source is object just use it */
            if (instanceColor) {
              if (instanceColor.source === 'object') {
                instancedNodes[j].model.color = instanceColor.value
                /** If there is a color for the instance and the source is block, search upwards */
              } else if (instanceColor.source === 'block') {
                /** Get the parent instance, or itself if it's not nested */
                const parentInstance =
                  this.tree
                    .getAncestors(instanceProxyNodes[i])
                    .find(
                      (value: TreeNode) =>
                        this.getSpeckleType(value.model.raw) ===
                        SpeckleType.InstanceProxy
                    ) || instanceProxyNodes[i]
                /** Use the parent instance or self instance color */
                const color = this.colorMap[parentInstance.model.raw.applicationId]
                instancedNodes[j].model.color = color?.value
              }
            }
          }
        }
      }
    }
  }

  private async PointcloudToNode(obj: SpeckleObject, node: TreeNode) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    node.model.raw.points = await this.dechunk(obj.points)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    node.model.raw.colors = await this.dechunk(obj.colors)
  }

  private async BrepToNode(obj: SpeckleObject, node: TreeNode) {
    try {
      if (!obj) return

      let displayValue = this.getDisplayValue(obj)

      if (Array.isArray(displayValue)) displayValue = displayValue[0] //Just take the first display value for now (not ideal)
      if (!displayValue) return

      const ref = await this.resolveReference(displayValue as SpeckleObject)
      const nestedNode: TreeNode = this.tree.parse({
        id: node.model.instanced
          ? this.getCompoundId(ref.id, this.instanceCounter++)
          : this.getNodeId(ref),
        raw: ref,
        atomic: false,
        children: [],
        ...(node.model.instanced && { instanced: node.model.instanced })
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

  private async MeshToNode(obj: SpeckleObject, node: TreeNode) {
    if (!obj) return
    if (!obj.vertices || (obj.vertices as Array<number>).length === 0) {
      Logger.warn(
        `Object id ${obj.id} of type ${obj.speckle_type} has no vertex position data and will be ignored`
      )
      return
    }
    if (!obj.faces || (obj.faces as Array<number>).length === 0) {
      Logger.warn(
        `Object id ${obj.id} of type ${obj.speckle_type} has no face data and will be ignored`
      )
      return
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    node.model.raw.vertices = await this.dechunk(obj.vertices)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    node.model.raw.faces = await this.dechunk(obj.faces)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    node.model.raw.colors = await this.dechunk(obj.colors)
  }

  private async TextToNode(_obj: SpeckleObject, _node: TreeNode) {
    return
  }

  private async DimensionToNode(obj: SpeckleObject, node: TreeNode) {
    const displayValues = [...(this.getDisplayValue(obj) as SpeckleObject[])]
    for (const displayValue of displayValues) {
      const childNode: TreeNode = this.tree.parse({
        id: this.getNodeId(displayValue),
        raw: displayValue,
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
      id: MathUtils.generateUUID(),
      raw: textObj,
      atomic: false,
      children: []
    })
    this.tree.addNode(textNode, node)
    await this.convertToNode(textObj, textNode)
  }

  private async PointToNode(_obj: SpeckleObject, _node: TreeNode) {
    return
  }
  private async LineToNode(_obj: SpeckleObject, _node: TreeNode) {
    return
  }

  private async PolylineToNode(obj: SpeckleObject, node: TreeNode) {
    node.model.raw.value = await this.dechunk(
      obj.value as Array<{ referencedId: string }>
    )
  }

  private async BoxToNode(_obj: SpeckleObject, _node: TreeNode) {
    return
  }

  private async PolycurveToNode(obj: SpeckleObject, node: TreeNode) {
    node.model.nestedNodes = []
    for (
      let i = 0;
      i < (obj as unknown as { segments: SpeckleObject[] }).segments.length;
      i++
    ) {
      let element = (obj as unknown as { segments: SpeckleObject[] }).segments[i]
      /** Not a big fan of this... */
      if (!this.directNodeConverterExists(element)) {
        element = this.getDisplayValue(element) as SpeckleObject
        if (element.referencedId) {
          element = await this.resolveReference(element)
        }
      }
      const nestedNode: TreeNode = this.tree.parse({
        id: this.getNodeId(element),
        raw: element,
        atomic: false,
        children: []
      })
      await this.convertToNode(element, nestedNode)
      /** We're not adding the segments as children since they shouldn't exist as individual line elements */
      node.model.nestedNodes.push(nestedNode)
    }
  }

  private async CurveToNode(obj: SpeckleObject, node: TreeNode) {
    let displayValue: SpeckleObject = this.getDisplayValue(obj) as SpeckleObject
    if (!displayValue) {
      Logger.warn(
        `Object ${obj.id} of type ${obj.speckle_type} has no display value and will be ignored`
      )
      return
    }
    node.model.nestedNodes = []
    displayValue = await this.resolveReference(obj.displayValue as SpeckleObject)
    displayValue.units = displayValue.units || obj.units
    const nestedNode: TreeNode = this.tree.parse({
      id: this.getNodeId(displayValue),
      raw: displayValue,
      atomic: false,
      children: []
    })
    await this.convertToNode(displayValue, nestedNode)
    /** We're not adding the segments as children since they shouldn't exist as individual line elements */
    node.model.nestedNodes.push(nestedNode)
  }

  private async CircleToNode(_obj: SpeckleObject, _node: TreeNode) {
    return
  }

  private async ArcToNode(_obj: SpeckleObject, _node: TreeNode) {
    return
  }

  private async EllipseToNode(_obj: SpeckleObject, _node: TreeNode) {
    return
  }
}
