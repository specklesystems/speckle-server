import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'
import FilteringManager from './FilteringManager'

/**
 * Container for the scene objects, to allow loading/unloading/filtering/coloring/grouping
 */
export default class SceneObjects {
  constructor(viewer) {
    this.viewer = viewer
    this.scene = viewer.scene

    this.allObjects = new THREE.Group()
    this.allObjects.name = 'allObjects'

    this.allSolidObjects = new THREE.Group()
    this.allSolidObjects.name = 'allSolidObjects'
    this.allSolidObjects.visible = false // these are grouped later, we never want to display them individually
    this.allObjects.add(this.allSolidObjects)

    this.allTransparentObjects = new THREE.Group()
    this.allTransparentObjects.name = 'allTransparentObjects'
    this.allObjects.add(this.allTransparentObjects)

    this.allLineObjects = new THREE.Group()
    this.allLineObjects.name = 'allLineObjects'
    this.allObjects.add(this.allLineObjects)

    this.allPointObjects = new THREE.Group()
    this.allPointObjects.name = 'allPointObjects'
    this.allObjects.add(this.allPointObjects)

    // Grouped solid objects, generated from `allSolidObjects`
    this.groupedSolidObjects = new THREE.Group()
    this.groupedSolidObjects.name = 'groupedSolidObjects'
    this.allObjects.add(this.groupedSolidObjects)

    this.filteringManager = new FilteringManager(this.viewer)
    this.filteredObjects = null
    this.ghostedObjects = null

    this.appliedFilter = null

    // When the `appliedFilter` is null, scene will contain `allObjects`. Otherwise, `filteredObjects`
    // This is to optimize the no-filter usecase, so we don't make an unnecessary clone of all the objects
    this.objectsInScene = this.allObjects
    this.scene.add(this.allObjects)

    this.isBusy = true
    this.lastAsyncPause = Date.now()
  }

  async asyncPause() {
    // Don't freeze the UI when doing all those traversals
    if (Date.now() - this.lastAsyncPause >= 100) {
      await new Promise((resolve) => setTimeout(resolve, 0))
      this.lastAsyncPause = Date.now()
    }
  }

  getObjectsProperties(includeAll = true) {
    const flattenObject = function (obj) {
      const flatten = {}
      for (const k in obj) {
        if (['id', '__closure', '__parents', 'bbox', 'totalChildrenCount'].includes(k))
          continue
        const v = obj[k]
        if (v === null || v === undefined || Array.isArray(v)) continue
        if (v.constructor === Object) {
          const flattenProp = flattenObject(v)
          for (const pk in flattenProp) {
            flatten[`${k}.${pk}`] = flattenProp[pk]
          }
          continue
        }
        if (['string', 'number', 'boolean'].includes(typeof v)) flatten[k] = v
      }
      return flatten
    }

    const targetObjects = includeAll ? this.allObjects : this.objectsInScene

    const propValues = {}
    for (const objGroup of targetObjects.children) {
      for (const threeObj of objGroup.children) {
        const obj = flattenObject(threeObj.userData)
        for (const prop of Object.keys(obj)) {
          if (!(prop in propValues)) {
            propValues[prop] = []
          }
          propValues[prop].push(obj[prop])
        }
      }
    }

    const propInfo = {}
    for (const prop in propValues) {
      const pinfo = {
        type: typeof propValues[prop][0],
        objectCount: propValues[prop].length,
        allValues: propValues[prop],
        uniqueValues: {},
        minValue: propValues[prop][0],
        maxValue: propValues[prop][0]
      }
      for (const v of propValues[prop]) {
        if (v < pinfo.minValue) pinfo.minValue = v
        if (v > pinfo.maxValue) pinfo.maxValue = v
        if (!(v in pinfo.uniqueValues)) {
          pinfo.uniqueValues[v] = 0
        }
        pinfo.uniqueValues[v] += 1
      }

      propInfo[prop] = pinfo
    }
    return propInfo
  }

  async applyFilterToGroup(threejsGroup, filter, ghostedObjectsOutput) {
    const ret = new THREE.Group()
    ret.name = 'filtered_' + threejsGroup.name

    for (const obj of threejsGroup.children) {
      await this.asyncPause()
      const filteredObj = this.filteringManager.filterAndColorObject(obj, filter)
      if (filteredObj) {
        if (ghostedObjectsOutput && filteredObj.userData.hidden) {
          ghostedObjectsOutput.add(filteredObj)
        } else {
          ret.add(filteredObj)
        }
      }
    }
    return ret
  }

  disposeAndClearGroup(threejsGroup, disposeGeometry = true) {
    for (const child of threejsGroup.children) {
      if (child.type === 'Group') {
        this.disposeAndClearGroup(child, disposeGeometry)
      }
      if (child.material) child.material.dispose()
      if (disposeGeometry && child.geometry) child.geometry.dispose()
    }
    threejsGroup.clear()
  }

  async applyFilter(filter) {
    // eslint-disable-next-line no-param-reassign
    if (filter === undefined) filter = this.appliedFilter

    if (filter === null) {
      // Remove filters, use allObjects
      const newGoupedSolidObjects = await this.groupSolidObjects(this.allSolidObjects)

      if (this.groupedSolidObjects !== null) {
        this.disposeAndClearGroup(this.groupedSolidObjects)
        this.allObjects.remove(this.groupedSolidObjects)
      }
      this.groupedSolidObjects = newGoupedSolidObjects
      this.allObjects.add(this.groupedSolidObjects)

      if (this.filteredObjects !== null) {
        this.disposeAndClearGroup(this.filteredObjects)
        this.filteredObjects = null
      }
      if (this.ghostedObjects !== null) {
        this.scene.remove(this.ghostedObjects)
        this.disposeAndClearGroup(this.ghostedObjects)
        this.ghostedObjects = null
      }

      this.scene.remove(this.objectsInScene)
      this.scene.add(this.allObjects)
      this.objectsInScene = this.allObjects
    } else {
      // A filter is to be applied
      this.filteringManager.initFilterOperation()

      const newFilteredObjects = new THREE.Group()
      newFilteredObjects.name = 'FilteredObjects'

      const newGhostedObjects = new THREE.Group()
      newGhostedObjects.name = 'GhostedObjects'

      const filteredSolidObjects = await this.applyFilterToGroup(
        this.allSolidObjects,
        filter,
        newGhostedObjects
      )
      filteredSolidObjects.visible = false
      newFilteredObjects.add(filteredSolidObjects)

      const filteredLineObjects = await this.applyFilterToGroup(
        this.allLineObjects,
        filter,
        newGhostedObjects
      )
      newFilteredObjects.add(filteredLineObjects)

      const filteredTransparentObjects = await this.applyFilterToGroup(
        this.allTransparentObjects,
        filter,
        newGhostedObjects
      )
      newFilteredObjects.add(filteredTransparentObjects)

      const filteredPointObjects = await this.applyFilterToGroup(
        this.allPointObjects,
        filter,
        newGhostedObjects
      )
      newFilteredObjects.add(filteredPointObjects)

      // group solid objects
      const groupedFilteredSolidObjects = await this.groupSolidObjects(
        filteredSolidObjects
      )
      newFilteredObjects.add(groupedFilteredSolidObjects)

      const groupedGhostedObjects = await this.groupSolidObjects(newGhostedObjects)

      // Sync update scene
      if (this.filteredObjects !== null) {
        this.disposeAndClearGroup(this.filteredObjects)
      }
      this.filteredObjects = newFilteredObjects

      if (this.ghostedObjects !== null) {
        this.scene.remove(this.ghostedObjects)
        this.disposeAndClearGroup(this.ghostedObjects)
      }
      this.ghostedObjects = groupedGhostedObjects
      this.scene.add(this.ghostedObjects)

      this.scene.remove(this.objectsInScene)
      this.scene.add(this.filteredObjects)
      this.objectsInScene = this.filteredObjects
    }

    this.appliedFilter = filter
    this.viewer.needsRender = true

    return { colorLegend: this.filteringManager.colorLegend }
  }

  flattenGroup(group) {
    const acc = []
    for (const child of group.children) {
      if (child instanceof THREE.Group) {
        acc.push(...this.flattenGroup(child))
      } else {
        acc.push(child.clone())
      }
    }
    for (const element of acc) {
      element.geometry = element.geometry.clone()
      element.geometry.applyMatrix4(group.matrix)
    }
    return acc
  }

  async groupSolidObjects(threejsGroup) {
    const materialIdToBufferGeometry = {}
    const materialIdToMaterial = {}
    const materialIdToMeshes = {}

    const groupedObjects = new THREE.Group()
    groupedObjects.name = 'GroupedSolidObjects'

    for (const obj of threejsGroup.children) {
      let meshes = []
      if (obj instanceof THREE.Group) {
        meshes = this.flattenGroup(obj)
      } else {
        meshes = [obj]
      }

      for (const mesh of meshes) {
        const m = mesh.material

        // Pass-through non mesh materials (blocks can contain lines, that end up here)
        if (
          !(
            m instanceof THREE.MeshStandardMaterial ||
            m instanceof THREE.MeshBasicMaterial
          )
        ) {
          // if ( mesh.type === 'Line' ) continue
          // if ( groupedObjects.children.length >= 2 ) continue
          groupedObjects.add(mesh.clone())
          continue
        }

        let materialId = `${m.type}/${m.vertexColors}/${m.color.toJSON()}/${m.side}/${
          m.transparent
        }/${m.opacity}/${m.emissive}/${m.metalness}/${m.roughness}/${m.wireframe}`

        materialId += `--${Object.keys(mesh.geometry.attributes).toString()}--${!!mesh
          .geometry.index}`

        if (!(materialId in materialIdToBufferGeometry)) {
          materialIdToBufferGeometry[materialId] = []
          materialIdToMaterial[materialId] = m
          materialIdToMeshes[materialId] = []
        }

        materialIdToBufferGeometry[materialId].push(mesh.geometry)
        materialIdToMeshes[materialId].push(mesh)

        // Max 1024 objects per group (mergeBufferGeometries is sync and can freeze for large data)
        if (materialIdToBufferGeometry[materialId].length >= 1024) {
          const archivedMaterialId = `arch//${materialId}//${mesh.id}`
          materialIdToBufferGeometry[archivedMaterialId] =
            materialIdToBufferGeometry[materialId]
          materialIdToMaterial[archivedMaterialId] = materialIdToMaterial[materialId]
          materialIdToMeshes[archivedMaterialId] = materialIdToMeshes[materialId]
          delete materialIdToBufferGeometry[materialId]
          delete materialIdToMaterial[materialId]
          delete materialIdToMeshes[materialId]
        }
      }
    }

    await this.asyncPause()

    for (const materialId in materialIdToBufferGeometry) {
      await this.asyncPause()
      const groupGeometry = BufferGeometryUtils.mergeBufferGeometries(
        materialIdToBufferGeometry[materialId]
      )
      await this.asyncPause()

      const groupMaterial = materialIdToMaterial[materialId]
      const groupMesh = new THREE.Mesh(groupGeometry, groupMaterial)
      groupMesh.userData = null
      groupedObjects.add(groupMesh)
    }

    return groupedObjects
  }
}
