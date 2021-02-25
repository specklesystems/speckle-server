import * as THREE from 'three'
import debounce from 'lodash.debounce'

/**
 * Manages objects and provides some convenience methods to focus on the entire scene, or one specific object.
 */
export default class SceneObjectManager {

  constructor( viewer ) {
    this.viewer = viewer
    this.scene = viewer.scene
    this.userObjects = new THREE.Group()
    this.solidObjects = new THREE.Group()
    this.lineObjects = new THREE.Group()
    this.pointObjects = new THREE.Group()
    this.transparentObjects = new THREE.Group()

    this.userObjects.add( this.solidObjects )
    this.userObjects.add( this.transparentObjects )
    this.userObjects.add( this.lineObjects )
    this.userObjects.add( this.pointObjects )
    this.scene.add( this.userObjects )

    this.solidMaterial = new THREE.MeshStandardMaterial( {
      color: 0x8D9194,
      emissive: 0x0,
      roughness: 1,
      metalness: 0,
      side: THREE.DoubleSide,
      envMap: this.viewer.cubeCamera.renderTarget.texture
    } )

    this.transparentMaterial = new THREE.MeshStandardMaterial( {
      color: 0xA0A4A8,
      emissive: 0x0,
      roughness: 0,
      metalness: 0.5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
      envMap: this.viewer.cubeCamera.renderTarget.texture
    } )

    this.lineMaterial = new THREE.LineBasicMaterial( { color: 0x7F7F7F } )
    this.pointMaterial = new THREE.PointsMaterial( { size: 10, sizeAttenuation: false, color: 0x7F7F7F } )

    this.objectIds = []
    this.postLoad = debounce( () => { this._postLoadFunction() }, 200 )

    this.loaders = []
  }

  get objects() {
    return [ ...this.solidObjects.children, ...this.transparentObjects.children, ...this.lineObjects.children, ...this.pointObjects.children ]
  }

  get materials() {
    return [ this.lineMaterial, this.pointMaterial, this.transparentMaterial, this.solidMaterial ]
  }

  // Note: we might switch later down the line from cloning materials to solely
  // using a few "default" ones and controlling color through vertex colors.
  // For now a small compromise to speed up dev; it is not the most memory
  // efficient approach.
  // To support big models we might need to merge everything in buffer geometries,
  // and control things separately to squeeze those sweet FPS (esp mobile); but
  // this conflicts a bit with the interactivity requirements of the viewer, esp.
  // the TODO ones (colour by property).
  addObject( wrapper ) {
    if ( !wrapper || !wrapper.bufferGeometry ) return


    switch ( wrapper.geometryType ) {

    case 'solid':
      // Do we have a defined material?
      if ( wrapper.meta.renderMaterial ) {

        let renderMat = wrapper.meta.renderMaterial
        let color = new THREE.Color( this._argbToRGB( renderMat.diffuse ) )
        this._normaliseColor( color )
        // Is it a transparent material?
        if ( renderMat.opacity !== 1 ) {
          let material = this.transparentMaterial.clone()
          material.clippingPlanes = this.viewer.interactions.sectionBox.planes

          material.color = color
          material.opacity = renderMat.opacity !== 0 ? renderMat.opacity : 0.2
          this.addTransparentSolid( wrapper, material )

        // It's not a transparent material!
        } else {
          let material = this.solidMaterial.clone()
          material.clippingPlanes = this.viewer.interactions.sectionBox.planes

          material.color = color
          material.metalness = renderMat.metalness
          if ( material.metalness !== 0 ) material.roughness = 0.1
          if ( material.metalness > 0.8 ) material.color = new THREE.Color( '#CDCDCD' ) // hack for rhino metal materials being black FFS
          this.addSolid( wrapper, material )
        }
      } else {
        // If we don't have defined material, just use the default
        let material = this.solidMaterial.clone()
        material.clippingPlanes = this.viewer.interactions.sectionBox.planes

        this.addSolid( wrapper, material )
      }
      break

    case 'line':
      this.addLine( wrapper )
      break

    case 'point':
      this.addPoint( wrapper )
      break
    }

    this.postLoad()
  }

  addSolid( wrapper, material ) {
    const mesh = new THREE.Mesh( wrapper.bufferGeometry, material ? material : this.solidMaterial )
    mesh.userData = wrapper.meta
    mesh.uuid = wrapper.meta.id
    this.objectIds.push( mesh.uuid )
    this.solidObjects.add( mesh )
  }

  addTransparentSolid( wrapper, material ) {
    const mesh = new THREE.Mesh( wrapper.bufferGeometry, material ? material : this.transparentMaterial )
    mesh.userData = wrapper.meta
    mesh.uuid = wrapper.meta.id
    this.objectIds.push( mesh.uuid )
    this.transparentObjects.add( mesh )
  }

  addLine( wrapper ) {
    const line = new THREE.Line( wrapper.bufferGeometry, this.lineMaterial )
    line.userData = wrapper.meta
    line.uuid = wrapper.meta.id
    this.objectIds.push( line.uuid )
    this.lineObjects.add( line )
  }

  addPoint( wrapper ){
    var dot = new THREE.Points( wrapper.bufferGeometry, this.pointMaterial )
    dot.userData = wrapper.meta
    dot.uuid = wrapper.meta.id
    this.objectIds.push( dot.uuid )
    this.pointObjects.add( dot )
  }

  removeObject( id ) {
    // TODO
  }

  removeAllObjects() {
    for ( let obj of this.objects ) {
      if ( obj.geometry ){
        obj.geometry.dispose()
      }
    }
    this.solidObjects.clear()
    this.transparentObjects.clear()
    this.lineObjects.clear()
    this.pointObjects.clear()

    this.viewer.interactions.deselectObjects()
    this.viewer.interactions.hideSectionBox()
    this.objectIds = []

    this._postLoadFunction()
  }

  _postLoadFunction() {
    this.viewer.interactions.zoomExtents()
    this.viewer.interactions.hideSectionBox()
    this.viewer.reflectionsNeedUpdate = true
  }

  getSceneBoundingBox() {
    if ( this.objects.length === 0 )  {
      let box = new THREE.Box3( new THREE.Vector3( -1,-1,-1 ), new THREE.Vector3( 1,1,1 ) )
      return box
    }
    let box = new THREE.Box3().setFromObject( this.userObjects )
    return box
  }

  _argbToRGB( argb ) {
    return '#'+ ( '000000' + ( argb & 0xFFFFFF ).toString( 16 ) ).slice( -6 )
  }

  _normaliseColor( color ) {
    // Note: full of **magic numbers** that will need changing once global scene
    // is properly set up; also to test with materials coming from other software too...
    let hsl = {}
    color.getHSL( hsl )

    if ( hsl.s + hsl.l > 1 ) {
      while ( hsl.s + hsl.l > 1 ){
        hsl.s -= 0.05
        hsl.l -= 0.05
      }
    }

    if ( hsl.l > 0.6 ) {
      hsl.l = 0.6
    }

    if ( hsl.l < 0.3 ) {
      hsl.l = 0.3
    }

    color.setHSL( hsl.h, hsl.s, hsl.l )
  }

}
