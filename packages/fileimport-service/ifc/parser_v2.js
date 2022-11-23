const { performance } = require('perf_hooks')
const WebIFC = require('web-ifc/web-ifc-api-node')
// import { getHash, IfcElements, PropNames, GeometryTypes, IfcTypesMap } from './utils'
const {
  getHash,
  IfcElements,
  PropNames,
  GeometryTypes,
  IfcTypesMap
} = require('./utils')

module.exports = class IFCParser {
  constructor({ serverApi }) {
    this.ifcapi = new WebIFC.IfcAPI()
    this.ifcapi.SetWasmPath('./', false)
    this.serverApi = serverApi
  }

  async parse(data) {
    await this.ifcapi.Init()
    this.modelId = this.ifcapi.OpenModel(new Uint8Array(data), { USE_FAST_BOOLS: true })

    // prepoulate types
    const p1 = performance.now()
    this.types = await this.getAllTypesOfModel()

    // prime caches for property sets and their relating objects, as well as,
    // most importantly, all the properties.
    const { psetLines, psetRelations, properties } = await this.getAllProps()
    this.psetLines = psetLines
    this.psetRelations = psetRelations
    this.properties = properties

    this.propCache = {}
    // create and save the geometries; we're storing only references locally.
    const p2 = performance.now()
    console.log(`prop warmup ${(p2 - p1).toFixed(2)}ms`)
    this.geometryReferences = await this.createAndSaveMeshes()

    const p3 = performance.now()
    console.log(`geometry warmup ${(p3 - p2).toFixed(2)}ms`)

    // create and save the spatial tree, populating both properties and geometry references
    // where appropriate
    this.spatialNodeCount = 0
    const structure = await this.createSpatialStructure()
    const p4 = performance.now()
    console.log(`structure ${(p4 - p3).toFixed(2)}ms`)
    console.log(`total time spent: ${(p4 - p1).toFixed(2)}ms`)
    console.log(structure.id)
    return { id: structure.id, tCount: structure.closureLen }
  }

  async createSpatialStructure() {
    const chunks = await this.getSpatialTreeChunks()
    const allProjectLines = await this.ifcapi.GetLineIDsWithType(
      this.modelId,
      WebIFC.IFCPROJECT
    )
    const project = {
      expressID: allProjectLines.get(0),
      type: 'IFCPROJECT',
      children: []
    }

    await this.populateSpatialNode(project, chunks, [])
    return project
  }

  async populateSpatialNode(node, chunks, closures) {
    process.stdout.write(`${this.spatialNodeCount++} nodes generated \r`)
    closures.push([])
    await this.getChildren(node, chunks, PropNames.aggregates, closures)
    await this.getChildren(node, chunks, PropNames.spatial, closures)

    node.closure = [...new Set(closures.pop())]

    // get geometry, set displayValue
    // add geometry ids to closure
    if (
      this.geometryReferences[node.expressID] &&
      this.geometryReferences[node.expressID].length !== 0
    ) {
      node['@displayValue'] = this.geometryReferences[node.expressID]
      node.closure.push(
        ...this.geometryReferences[node.expressID].map((ref) => ref.referencedId)
      )
    }
    node.closureLen = node.closure.length
    node.__closure = this.formatClosure(node.closure)
    node.id = getHash(node)
    // delete node.closure
    await this.serverApi.saveObject(node)
    return node.id
  }

  formatClosure(idsArray) {
    const cl = {}
    for (const id of idsArray) cl[id] = 1
    return cl
  }

  async getChildren(node, chunks, propName, closures) {
    const children = chunks[node.expressID]
    if (!children) return
    const prop = propName.key
    const nodes = []
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      const node = this.createNode(child)
      node.properties = await this.getItemProperties(node.expressID)
      node.id = await this.populateSpatialNode(node, chunks, closures)
      for (const closure of closures) closure.push(node.id, ...node.closure)
      delete node.closure
      nodes.push(node)
    }

    node[prop] = nodes.map((node) => ({
      speckle_type: 'reference',
      referencedId: node.id
    }))
  }

  async getItemProperties(id) {
    if (this.propCache[id]) return this.propCache[id]

    let props = {}
    const directProps = this.properties[id.toString()]
    props = { ...directProps }

    const psetIds = []
    for (let i = 0; i < this.psetRelations.length; i++) {
      if (this.psetRelations[i].includes(id))
        psetIds.push(this.psetLines.get(i).toString())
    }

    const rawPsetIds = psetIds.map((id) =>
      this.properties[id].RelatingPropertyDefinition.toString()
    )
    const rawPsets = rawPsetIds.map((id) => this.properties[id])
    for (const pset of rawPsets) {
      props[pset.Name] = this.unpackPsetOrComplexProp(pset)
    }

    this.propCache[id] = props
    return props
  }

  unpackPsetOrComplexProp(pset) {
    const parsed = {}
    if (!pset.HasProperties || !Array.isArray(pset.HasProperties)) return parsed
    for (const id of pset.HasProperties) {
      const value = this.properties[id.toString()]
      if (value?.type === 'IFCCOMPLEXPROPERTY') {
        parsed[value.Name] = this.unpackPsetOrComplexProp(value)
      } else if (value?.type === 'IFCPROPERTYSINGLEVALUE') {
        parsed[value.Name] = value.NominalValue
      }
    }
    return parsed
  }

  async getSpatialTreeChunks() {
    const treeChunks = {}
    await this.getChunks(treeChunks, PropNames.aggregates)
    await this.getChunks(treeChunks, PropNames.spatial)
    return treeChunks
  }

  async getChunks(chunks, propName) {
    const relation = await this.ifcapi.GetLineIDsWithType(this.modelId, propName.name)
    for (let i = 0; i < relation.size(); i++) {
      const rel = await this.ifcapi.GetLine(this.modelId, relation.get(i), false)
      this.saveChunk(chunks, propName, rel)
    }
  }

  saveChunk(chunks, propName, rel) {
    const relating = rel[propName.relating].value
    const related = rel[propName.related].map((r) => r.value)
    if (chunks[relating] == undefined) {
      chunks[relating] = related
    } else {
      chunks[relating] = chunks[relating].concat(related)
    }
  }

  async getAllTypesOfModel() {
    const result = {}
    const elements = Object.keys(IfcElements).map((e) => parseInt(e))
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      const lines = await this.ifcapi.GetLineIDsWithType(this.modelId, element)
      const size = lines.size()
      for (let i = 0; i < size; i++) result[lines.get(i)] = element
    }
    return result
  }

  async getAllProps() {
    const psetLines = this.ifcapi.GetLineIDsWithType(
      this.modelId,
      WebIFC.IFCRELDEFINESBYPROPERTIES
    )
    const psetRelations = []
    const properties = {}

    const geometryIds = await this.getAllGeometriesIds()
    const allLinesIDs = await this.ifcapi.GetAllLines(this.modelId)
    const allLinesCount = allLinesIDs.size()
    for (let i = 0; i < allLinesCount; i++) {
      process.stdout.write(`${((i / allLinesCount) * 100).toFixed(3)}% props \r`)
      const id = allLinesIDs.get(i)
      if (!geometryIds.has(id)) {
        const props = await this.getItemProperty(id)
        if (props) {
          if (props.type === 'IFCRELDEFINESBYPROPERTIES' && props.RelatedObjects) {
            psetRelations.push(props.RelatedObjects)
          }
          properties[id] = props
        }
      }
    }

    return { psetLines, psetRelations, properties }
  }

  async getItemProperty(id) {
    try {
      const props = await this.ifcapi.GetLine(this.modelId, id)
      if (props.type) {
        props.type = IfcTypesMap[props.type]
      }
      this.inPlaceFormatItemProperties(props)
      return props
    } catch (e) {
      console.log(`There was an issue getting props of id ${id}`)
    }
  }

  inPlaceFormatItemProperties(props) {
    Object.keys(props).forEach((key) => {
      const value = props[key]
      if (value && value.value !== undefined) props[key] = value.value
      else if (Array.isArray(value))
        props[key] = value.map((item) => {
          if (item && item.value) return item.value
          return item
        })
    })
  }

  createNode(id) {
    const typeName = this.getNodeType(id)
    return {
      speckle_type: typeName,
      expressID: id,
      type: typeName,
      children: [],
      properties: null
    }
  }

  getNodeType(id) {
    const typeID = this.types[id]
    return IfcElements[typeID]
  }

  async getAllGeometriesIds() {
    const geometriesIds = new Set()
    const geomTypesArray = Array.from(GeometryTypes)
    for (let i = 0; i < geomTypesArray.length; i++) {
      const category = geomTypesArray[i]
      const ids = await this.ifcapi.GetLineIDsWithType(this.modelId, category)
      const idsSize = ids.size()
      for (let j = 0; j < idsSize; j++) {
        geometriesIds.add(ids.get(j))
      }
    }
    this.geometryIdsCount = geometriesIds.size
    return geometriesIds
  }

  async createAndSaveMeshes() {
    const geometryReferences = {}
    let count = 0
    const speckleMeshes = []

    this.ifcapi.StreamAllMeshes(this.modelId, (mesh) => {
      const placedGeometries = mesh.geometries
      geometryReferences[mesh.expressID] = []

      for (let i = 0; i < placedGeometries.size(); i++) {
        process.stdout.write(
          `${(count++).toFixed(3)} geoms generated out of ${this.geometryIdsCount} \r`
        )
        const placedGeometry = placedGeometries.get(i)
        const geometry = this.ifcapi.GetGeometry(
          this.modelId,
          placedGeometry.geometryExpressID
        )

        const verts = [
          ...this.ifcapi.GetVertexArray(
            geometry.GetVertexData(),
            geometry.GetVertexDataSize()
          )
        ]

        const indices = [
          ...this.ifcapi.GetIndexArray(
            geometry.GetIndexData(),
            geometry.GetIndexDataSize()
          )
        ]

        const { vertices } = this.extractVertexData(
          verts,
          placedGeometry.flatTransformation
        )
        const faces = this.extractFaces(indices)

        const speckleMesh = {
          speckle_type: 'Objects.Geometry.Mesh',
          units: 'm',
          volume: 0,
          area: 0,
          random: Math.random(),
          vertices,
          faces,
          renderMaterial: placedGeometry.color
            ? this.colorToMaterial(placedGeometry.color)
            : null
        }

        speckleMesh.id = getHash(speckleMesh)
        // Note: the web-ifc api disposes of the data post callback, and doesn't know that it's async;
        // we cannot and should not await things in here.
        // await this.serverApi.saveObject(speckleMesh)

        speckleMeshes.push(speckleMesh)
        geometryReferences[mesh.expressID].push({
          speckle_type: 'reference',
          referencedId: speckleMesh.id
        })
      }
    })

    // for (const p of speckleMeshes) {
    //   await this.serverApi.saveObject(p)
    // }

    await this.serverApi.saveObjectBatch(speckleMeshes)

    return geometryReferences
  }

  extractFaces(indices) {
    const faces = []
    for (let i = 0; i < indices.length; i++) {
      if (i % 3 === 0) faces.push(0)
      faces.push(indices[i])
    }
    return faces
  }

  extractVertexData(vertexData, matrix) {
    const vertices = []
    const normals = []
    let isNormalData = false
    for (let i = 0; i < vertexData.length; i++) {
      isNormalData ? normals.push(vertexData[i]) : vertices.push(vertexData[i])
      if ((i + 1) % 3 === 0) isNormalData = !isNormalData
    }

    // apply the transform
    for (let k = 0; k < vertices.length; k += 3) {
      const x = vertices[k],
        y = vertices[k + 1],
        z = vertices[k + 2]
      vertices[k] = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12]
      vertices[k + 1] =
        (matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]) * -1
      vertices[k + 2] = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13]
    }

    return { vertices, normals }
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
