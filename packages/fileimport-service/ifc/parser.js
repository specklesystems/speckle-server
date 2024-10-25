/* eslint-disable camelcase */
const WebIFC = require('web-ifc/web-ifc-api-node')
const { logger } = require('../observability/logging.js')
const ServerAPI = require('./api.js')

module.exports = class IFCParser {
  constructor({ db, serverApi, logger }) {
    this.api = new WebIFC.IfcAPI()
    this.serverApi = serverApi || new ServerAPI({ db, logger })
  }

  async parse(data) {
    if (this.api.wasmModule === undefined) await this.api.Init()

    this.modelId = this.api.OpenModel(data, {
      COORDINATE_TO_ORIGIN: true,
      USE_FAST_BOOLS: true
    })

    this.projectId = this.api.GetLineIDsWithType(this.modelId, WebIFC.IFCPROJECT).get(0)

    this.project = this.api.GetLine(this.modelId, this.projectId, true)
    this.project.__closure = {}

    this.cache = {}
    this.closureCache = {}

    // Steps: create and store in speckle all the geometries (meshes) from this project and store them
    // as reference objects in this.productGeo
    this.productGeo = {}
    await this.createGeometries()
    logger.info(`Geometries created: ${Object.keys(this.productGeo).length} meshes.`)

    // Lastly, traverse the ifc project object and parse it into something friendly; as well as
    // replace all its geometries with actual references to speckle meshes from the productGeo map

    await this.traverse(this.project, true, 0)

    const id = await this.serverApi.saveObject(this.project)
    return { id, tCount: Object.keys(this.project.__closure).length }
  }

  async createGeometries() {
    this.rawGeo = this.api.LoadAllGeometry(this.modelId)

    for (let i = 0; i < this.rawGeo.size(); i++) {
      const mesh = this.rawGeo.get(i)
      const prodId = mesh.expressID
      this.productGeo[prodId] = []

      for (let j = 0; j < mesh.geometries.size(); j++) {
        const placedGeom = mesh.geometries.get(j)
        const geom = this.api.GetGeometry(this.modelId, placedGeom.geometryExpressID)

        const matrix = placedGeom.flatTransformation
        const raw = {
          color: geom.color, // NOTE: material: x, y, z = rgb, w = opacity
          vertices: this.api.GetVertexArray(
            geom.GetVertexData(),
            geom.GetVertexDataSize()
          ),
          indices: this.api.GetIndexArray(geom.GetIndexData(), geom.GetIndexDataSize())
        }

        const { vertices } = this.extractVertexData(raw.vertices)

        for (let k = 0; k < vertices.length; k += 3) {
          const x = vertices[k],
            y = vertices[k + 1],
            z = vertices[k + 2]
          vertices[k] = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12]
          vertices[k + 1] =
            (matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]) * -1
          vertices[k + 2] = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13]
        }

        // Since all faces are triangles, we must add a `0` before each group of 3.
        const spcklFaces = []
        for (let i = 0; i < raw.indices.length; i++) {
          if (i % 3 === 0) spcklFaces.push(0)
          spcklFaces.push(raw.indices[i])
        }

        // Create a proper Speckle Mesh
        const spcklMesh = {
          speckle_type: 'Objects.Geometry.Mesh',
          units: 'm',
          volume: 0,
          area: 0,
          faces: spcklFaces,
          vertices: Array.from(vertices),
          renderMaterial: placedGeom.color
            ? this.colorToMaterial(placedGeom.color)
            : null
        }

        const id = await this.serverApi.saveObject(spcklMesh)
        const ref = { speckle_type: 'reference', referencedId: id }
        this.productGeo[prodId].push(ref)
      }
    }
  }

  async traverse(
    element,
    recursive = true,
    depth = 0,
    specialTypes = [
      { type: 'IfcProject', key: 'Name' },
      { type: 'IfcBuilding', key: 'Name' },
      { type: 'IfcSite', key: 'Name' }
    ]
  ) {
    // Fast exit if null/undefined
    if (!element) return

    // If array, traverse all items in it.
    if (Array.isArray(element)) {
      return await Promise.all(
        element.map(
          async (el) => await this.traverse(el, recursive, depth + 1, specialTypes)
        )
      )
    }

    // If it has no expressID, its either a simple type or a { type, value } object.
    if (!element.expressID) {
      return await Promise.resolve(
        element.value !== null && element.value !== undefined ? element.value : element
      )
    }

    if (this.cache[element.expressID.toString()])
      return this.cache[element.expressID.toString()]
    // If you got here -> It's an IFC Element: create base object, upload and return ref.
    // logger.debug( `Traversing element ${element.expressID}; Recurse: ${recursive}; Stack ${depth}` )

    // Traverse all key/value pairs first.
    for (const key of Object.keys(element)) {
      element[key] = await this.traverse(
        element[key],
        recursive,
        depth + 1,
        specialTypes
      )
    }

    // Assign speckle_type and empty closure table.
    element.speckle_type = element.constructor.name
    element.__closure = {}

    // Find spatial children and assign to element
    const spatialChildrenIds = this.getAllRelatedItemsOfType(
      element.expressID,
      WebIFC.IFCRELAGGREGATES,
      'RelatingObject',
      'RelatedObjects'
    )
    if (spatialChildrenIds.length > 0)
      element.rawSpatialChildren = spatialChildrenIds.map((childId) =>
        this.api.GetLine(this.modelId, childId, true)
      )

    // Find children and populate element
    const childrenIds = this.getAllRelatedItemsOfType(
      element.expressID,
      WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE,
      'RelatingStructure',
      'RelatedElements'
    )
    if (childrenIds.length > 0)
      element.rawChildren = childrenIds.map((childId) =>
        this.api.GetLine(this.modelId, childId, true)
      )

    // Find related property sets
    const psetsIds = this.getAllRelatedItemsOfType(
      element.expressID,
      WebIFC.IFCRELDEFINESBYPROPERTIES,
      'RelatingPropertyDefinition',
      'RelatedObjects'
    )
    if (psetsIds.length > 0)
      element.rawPsets = psetsIds.map((childId) =>
        this.api.GetLine(this.modelId, childId, true)
      )

    // Find related type properties
    const typePropsId = this.getAllRelatedItemsOfType(
      element.expressID,
      WebIFC.IFCRELDEFINESBYTYPE,
      'RelatingType',
      'RelatedObjects'
    )
    if (typePropsId.length > 0)
      element.rawTypeProps = typePropsId.map((childId) =>
        this.api.GetLine(this.modelId, childId, true)
      )

    // Lookup geometry in generated geometries object
    if (this.productGeo[element.expressID]) {
      element['@displayValue'] = this.productGeo[element.expressID]
      this.productGeo[element.expressID].forEach((ref) => {
        this.project.__closure[ref.referencedId.toString()] = depth
        element.__closure[ref.referencedId.toString()] = 1
      })
    }

    const isSpecial = specialTypes.find((t) => t.type === element.speckle_type)
    // Recurse all children
    if (recursive) {
      await this.processSubElements(
        element,
        'rawSpatialChildren',
        'spatialChildren',
        isSpecial,
        recursive,
        depth,
        specialTypes
      )
      await this.processSubElements(
        element,
        'rawChildren',
        'children',
        isSpecial,
        recursive,
        depth,
        specialTypes
      )
      await this.processSubElements(
        element,
        'rawPsets',
        'propertySets',
        false,
        recursive,
        depth,
        specialTypes
      )
      await this.processSubElements(
        element,
        'rawTypeProps',
        'typeProps',
        false,
        recursive,
        depth,
        specialTypes
      )

      if (
        element.children ||
        element.spatialChildren ||
        element.propertySets ||
        element.typeProps
      ) {
        logger.info(
          `${element.constructor.name} ${element.GlobalId}:\n\tchildren count: ${
            element.children ? element.children.length : '0'
          };\n\tspatial children count: ${
            element.spatialChildren ? element.spatialChildren.length : '0'
          };\n\tproperty sets count: ${
            element.propertySets ? element.propertySets.length : 0
          };\n\ttype properties: ${element.typeProps ? element.typeProps.length : 0}`
        )
      }
    }

    if (
      this.productGeo[element.expressID] ||
      element.spatialChildren ||
      element.children
    ) {
      const id = await this.serverApi.saveObject(element)
      const ref = { speckle_type: 'reference', referencedId: id }
      this.cache[element.expressID.toString()] = ref
      this.closureCache[element.expressID.toString()] = element.__closure
      return ref
    } else {
      this.cache[element.expressID.toString()] = element
      this.closureCache[element.expressID.toString()] = element.__closure
      return element
    }
  }

  async processSubElements(
    element,
    key,
    newKey,
    isSpecial,
    recursive,
    depth,
    specialTypes
  ) {
    if (element[key]) {
      if (!isSpecial) element[newKey] = []
      const childCount = {}
      for (const child of element[key]) {
        const res = await this.traverse(child, recursive, depth + 1, specialTypes)
        if (res.referencedId) {
          if (isSpecial) {
            let name = child[isSpecial.key]
            if (!name || name.length === 0) name = 'Undefined'
            if (!childCount[name]) childCount[name] = 0
            if (childCount[name] > 0) name += '-' + childCount[name]++
            element[name] = res
          } else element[newKey].push(res)
          this.project.__closure[res.referencedId.toString()] = depth
          element.__closure[res.referencedId.toString()] = 1

          // adds to parent (this element) the child's closure tree.
          if (this.closureCache[child.expressID.toString()]) {
            for (const key of Object.keys(
              this.closureCache[child.expressID.toString()]
            )) {
              element.__closure[key] =
                this.closureCache[child.expressID.toString()][key] + 1
            }
          }
        }
      }
      delete element[key]
    }
  }

  // (c) https://github.com/agviegas/web-ifc-three
  extractVertexData(vertexData) {
    const vertices = []
    const normals = []
    let isNormalData = false
    for (let i = 0; i < vertexData.length; i++) {
      isNormalData ? normals.push(vertexData[i]) : vertices.push(vertexData[i])
      if ((i + 1) % 3 === 0) isNormalData = !isNormalData
    }
    return { vertices, normals }
  }

  // (c) https://github.com/agviegas/web-ifc-three/blob/907e08b5673d5e1c18261a4fceade7189d6b2db7/src/IFC/PropertyManager.ts#L110
  getAllRelatedItemsOfType(elementID, type, relation, relatedProperty) {
    const lines = this.api.GetLineIDsWithType(this.modelId, type)
    const IDs = []

    for (let i = 0; i < lines.size(); i++) {
      const relID = lines.get(i)
      const rel = this.api.GetLine(this.modelId, relID)
      const relatedItems = rel[relation]
      let foundElement = false

      if (Array.isArray(relatedItems)) {
        const values = relatedItems.map((item) => item.value)
        foundElement = values.includes(elementID)
      } else foundElement = relatedItems.value === elementID

      if (foundElement) {
        const element = rel[relatedProperty]
        if (!Array.isArray(element)) IDs.push(element.value)
        else element.forEach((ele) => IDs.push(ele.value))
      }
    }

    return IDs
  }

  colorToMaterial(color) {
    const intColor =
      (color.w << 24) + ((color.x * 255) << 16) + ((color.y * 255) << 8) + color.z * 255

    return {
      diffuse: intColor,
      opacity: color.w,
      metalness: 0,
      roughness: 1,
      speckle_type: 'Objects.Other.RenderMaterial'
    }
  }
}
