import * as THREE from 'three'
import debounce from 'lodash.debounce'
import SceneObjects from './SceneObjects'

/**
 * Manages objects and provides some convenience methods to focus on the entire scene, or one specific object.
 */
export default class SceneObjectManager {
  constructor(viewer, skipPostLoad = false) {
    this.viewer = viewer
    this.scene = viewer.scene
    this.views = []

    this.sceneObjects = new SceneObjects(viewer)

    this.solidMaterial = new THREE.MeshStandardMaterial({
      color: 0x8d9194,
      emissive: 0x0,
      roughness: 1,
      metalness: 0,
      side: THREE.DoubleSide,
      envMap: this.viewer.cubeCamera.renderTarget.texture,
      clippingPlanes: this.viewer.sectionBox.planes
    })

    this.transparentMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0a4a8,
      emissive: 0x0,
      roughness: 0,
      metalness: 0.5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
      envMap: this.viewer.cubeCamera.renderTarget.texture,
      clippingPlanes: this.viewer.sectionBox.planes
    })

    this.solidVertexMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: THREE.VertexColors,
      side: THREE.DoubleSide,
      reflectivity: 0,
      clippingPlanes: this.viewer.sectionBox.planes
    })

    this.lineMaterial = new THREE.LineBasicMaterial({
      color: 0x7f7f7f,
      clippingPlanes: this.viewer.sectionBox.planes
    })

    this.pointMaterial = new THREE.PointsMaterial({
      size: 2,
      sizeAttenuation: false,
      color: 0x7f7f7f,
      clippingPlanes: this.viewer.sectionBox.planes
    })

    this.pointVertexColorsMaterial = new THREE.PointsMaterial({
      size: 2,
      sizeAttenuation: false,
      vertexColors: true,
      clippingPlanes: this.viewer.sectionBox.planes
    })

    this.postLoad = debounce(
      () => {
        this.postLoadFunction()
      },
      20,
      { maxWait: 5000 }
    )
    this.skipPostLoad = skipPostLoad
    this.loaders = []
  }

  get allObjects() {
    return [
      ...this.sceneObjects.allSolidObjects.children,
      ...this.sceneObjects.allTransparentObjects.children,
      ...this.sceneObjects.allLineObjects.children,
      ...this.sceneObjects.allPointObjects.children
    ]
  }

  get filteredObjects() {
    const ret = []
    for (const objectGroup of this.sceneObjects.objectsInScene.children) {
      if (objectGroup.name === 'GroupedSolidObjects') continue
      ret.push(...objectGroup.children)
    }
    return ret.filter((obj) => !obj.userData.hidden)
  }

  get materials() {
    return [
      this.lineMaterial,
      this.pointMaterial,
      this.transparentMaterial,
      this.solidMaterial,
      this.solidVertexMaterial,
      this.pointVertexColorsMaterial
    ]
  }

  // Note: we might switch later down the line from cloning materials to solely
  // using a few "default" ones and controlling color through vertex colors.
  // For now a small compromise to speed up dev; it is not the most memory
  // efficient approach.
  // To support big models we might need to merge everything in buffer geometries,
  // and control things separately to squeeze those sweet FPS (esp mobile); but
  // this conflicts a bit with the interactivity requirements of the viewer, esp.
  // the TODO ones (colour by property).
  addObject(wrapper, addToScene = true) {
    if (!wrapper || !wrapper.bufferGeometry) return

    // this.postLoad()

    switch (wrapper.geometryType) {
      case 'View':
        this.views.push(wrapper.meta)
        return null

      case 'solid':
        return this.addSolid(wrapper, addToScene)

      case 'line':
        return this.addLine(wrapper, addToScene)

      case 'point':
        return this.addPoint(wrapper, addToScene)

      case 'pointcloud':
        return this.addPointCloud(wrapper, addToScene)

      case 'block':
        return this.addBlock(wrapper, addToScene)
    }
  }

  addSolid(wrapper, addToScene = true) {
    // Do we have a defined material?
    if (wrapper.meta.renderMaterial) {
      const renderMat = wrapper.meta.renderMaterial
      const color = new THREE.Color(this._argbToRGB(renderMat.diffuse))
      this._normaliseColor(color)
      // Is it a transparent material?
      if (renderMat.opacity !== 1) {
        const material = this.transparentMaterial.clone()
        material.clippingPlanes = this.viewer.sectionBox.planes

        material.color = color
        material.opacity = renderMat.opacity !== 0 ? renderMat.opacity : 0.2
        return this.addSingleTransparentSolid(wrapper, material, addToScene)

        // It's not a transparent material!
      } else {
        const material = this.solidMaterial.clone()
        material.clippingPlanes = this.viewer.sectionBox.planes

        material.color = color
        material.metalness = renderMat.metalness
        if (material.metalness !== 0) material.roughness = 0.1
        if (material.metalness > 0.8) material.color = new THREE.Color('#CDCDCD') // hack for rhino metal materials being black FFS
        return this.addSingleSolid(wrapper, material, addToScene)
      }
    } else if (wrapper.bufferGeometry.attributes.color) {
      return this.addSingleSolid(wrapper, this.solidVertexMaterial, addToScene)
    } else {
      // If we don't have defined material, just use the default
      const material = this.solidMaterial.clone()
      material.clippingPlanes = this.viewer.sectionBox.planes

      return this.addSingleSolid(wrapper, material, addToScene)
    }
  }

  addSingleSolid(wrapper, material, addToScene = true) {
    const mesh = new THREE.Mesh(
      wrapper.bufferGeometry,
      material ? material : this.solidMaterial
    )
    // mesh.matrixAutoUpdate = false
    mesh.userData = wrapper.meta
    mesh.uuid = wrapper.meta.id
    if (addToScene) {
      // this.objectIds.push( mesh.uuid )
      this.sceneObjects.allSolidObjects.add(mesh)
    }
    return mesh
  }

  addSingleTransparentSolid(wrapper, material, addToScene = true) {
    const mesh = new THREE.Mesh(
      wrapper.bufferGeometry,
      material ? material : this.transparentMaterial
    )
    mesh.userData = wrapper.meta
    mesh.uuid = wrapper.meta.id
    if (addToScene) {
      // this.objectIds.push( mesh.uuid )
      this.sceneObjects.allTransparentObjects.add(mesh)
    }
    return mesh
  }

  addLine(wrapper, addToScene = true) {
    /** 
     * Display style doesn't seem to have anything regarding to opacity, so I assume lines/curves are always opaque?
     */
    let material = this.lineMaterial;
    if(wrapper.meta.displayStyle) {
      material = this.lineMaterial.clone();
      material.color = new THREE.Color(this._argbToRGB(wrapper.meta.displayStyle.color));
      material.color.convertSRGBToLinear();
      
      material.clippingPlanes = this.viewer.sectionBox.planes;
    }
    else if (wrapper.meta.renderMaterial) {
      material = this.lineMaterial.clone();
      material.color = new THREE.Color(this._argbToRGB(wrapper.meta.renderMaterial.diffuse));
      material.color.convertSRGBToLinear();
      material.clippingPlanes = this.viewer.sectionBox.planes;
    }

    const line = new THREE.Line(wrapper.bufferGeometry, material)
    line.userData = wrapper.meta
    line.uuid = wrapper.meta.id
    if (addToScene) {
      // this.objectIds.push( line.uuid )
      this.sceneObjects.allLineObjects.add(line)
    }
    return line
  }

  addPoint(wrapper, addToScene = true) {
    const dot = new THREE.Points(wrapper.bufferGeometry, this.pointMaterial)
    dot.userData = wrapper.meta
    dot.uuid = wrapper.meta.id
    if (addToScene) {
      // this.objectIds.push( dot.uuid )
      this.sceneObjects.allPointObjects.add(dot)
    }
    return dot
  }

  addPointCloud(wrapper, addToScene = true) {
    let clouds
    if (wrapper.bufferGeometry.attributes.color) {
      clouds = new THREE.Points(wrapper.bufferGeometry, this.pointVertexColorsMaterial)
    } else if (wrapper.meta.renderMaterial) {
      const renderMat = wrapper.meta.renderMaterial
      const color = new THREE.Color(this._argbToRGB(renderMat.diffuse))

      this._normaliseColor(color)
      const material = this.pointMaterial.clone()
      material.clippingPlanes = this.viewer.sectionBox.planes
      // material.clippingPlanes = this.viewer.interactions.sectionBox.planes

      material.color = color

      clouds = new THREE.Points(wrapper.bufferGeometry, material)
    } else {
      clouds = new THREE.Points(wrapper.bufferGeometry, this.pointMaterial)
    }

    clouds.userData = wrapper.meta
    clouds.uuid = wrapper.meta.id
    if (addToScene) {
      // this.objectIds.push( clouds.uuid )
      this.sceneObjects.allPointObjects.add(clouds)
    }
    return clouds
  }

  addBlock(wrapper, addToScene = true) {
    const group = new THREE.Group()

    wrapper.bufferGeometry.forEach((g) => {
      if (wrapper.meta.renderMaterial && !g.meta.renderMaterial) {
        g.meta.renderMaterial = wrapper.meta.renderMaterial
      }
      const res = this.addObject(g, false)
      if (res) group.add(res)
    })

    group.applyMatrix4(wrapper.extras.transformMatrix)
    group.uuid = wrapper.meta.id
    group.userData = wrapper.meta

    if (addToScene) {
      // Note: only apply the scale transform if this block is going to be added to the scene. otherwise it means it's a child of a nested block.
      group.applyMatrix4(wrapper.extras.scaleMatrix)
      // this.objectIds.push()
      this.sceneObjects.allSolidObjects.add(group)
    }

    return group
  }

  async removeImportedObject(importedUrl) {
    this.viewer.interactions.deselectObjects()

    for (const objGroup of this.sceneObjects.allObjects.children) {
      const toRemove = objGroup.children.filter(
        (obj) => obj.userData?.__importedUrl === importedUrl
      )
      toRemove.forEach((obj) => {
        if (obj.material) obj.material.dispose()
        if (obj.geometry) obj.geometry.dispose()
        objGroup.remove(obj)
      })
    }
    this.views = this.views.filter((v) => v.__importedUrl !== importedUrl)

    await this.sceneObjects.applyFilter(undefined, true)
  }

  async postLoadFunction() {
    if (this.skipPostLoad) return
    this.viewer.sectionBox.off()
    await this.sceneObjects.applyFilter()
    this.viewer.interactions.zoomExtents(undefined, false)
    this.viewer.reflectionsNeedUpdate = false
  }

  getSceneBoundingBox() {
    if (this.objects.length === 0) {
      const box = new THREE.Box3(
        new THREE.Vector3(-1, -1, -1),
        new THREE.Vector3(1, 1, 1)
      )
      return box
    }
    const box = new THREE.Box3().setFromObject(this.userObjects)
    return box
  }

  _argbToRGB(argb) {
    return '#' + ('000000' + (argb & 0xffffff).toString(16)).slice(-6)
  }

  _normaliseColor(color) {
    // Note: full of **magic numbers** that will need changing once global scene
    // is properly set up; also to test with materials coming from other software too...
    const hsl = {}
    color.getHSL(hsl)

    if (hsl.s + hsl.l > 1) {
      while (hsl.s + hsl.l > 1) {
        hsl.s -= 0.05
        hsl.l -= 0.05
      }
    }

    if (hsl.l > 0.6) {
      hsl.l = 0.6
    }

    if (hsl.l < 0.3) {
      hsl.l = 0.3
    }

    color.setHSL(hsl.h, hsl.s, hsl.l)
  }

  _srgbToLinear(x) {
		if (x <= 0)
			return 0;
		else if (x >= 1)
			return 1;
		else if (x < 0.04045)
			return x / 12.92;
		else
			return Math.pow((x + 0.055) / 1.055, 2.4);
	}
}
