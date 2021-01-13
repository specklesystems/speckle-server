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
    this.transparentObjects = new THREE.Group()

    this.userObjects.add( this.solidObjects )
    this.userObjects.add( this.transparentObjects )
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


    this.objectIds = []
    this.zoomExtentsDebounce = debounce( () => { this._postLoadFunction() }, 200 )
  }

  get objects() {
    return [ ...this.solidObjects.children, ...this.transparentObjects.children ]
  }

  // Note: we might switch later down the line from cloning materials to solely
  // using a few "default" ones and controlling color through vertex colors.
  // For now a small compromise to speed up dev; it is not the most memory
  // efficient approach.
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
          material.clippingPlanes = this.viewer.sectionPlaneHelper.planes
          material.color = color
          this.addTransparentSolid( wrapper, material )

        // It's not a transparent material!
        } else {
          let material = this.solidMaterial.clone()
          material.clippingPlanes = this.viewer.sectionPlaneHelper.planes
          material.color = color
          material.metalness = renderMat.metalness
          if ( material.metalness !== 0 ) material.roughness = 0.1
          if ( material.metalness > 0.8 ) material.color = new THREE.Color( '#CDCDCD' ) // hack for rhino metal materials being black FFS
          this.addSolid( wrapper, material )
        }
      } else {
        // If we don't have defined material, just use the default
        let material = this.solidMaterial.clone()
        material.clippingPlanes = this.viewer.sectionPlaneHelper.planes
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

    this.zoomExtentsDebounce()
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
    // TODO
  }

  addPoint( wrapper ){
    // TODO
  }

  removeObject( id ) {
    let obj = this.userObjects.children.find( o => o.uuid === id )
    if ( obj ){
      obj.geometry.dispose()
      this.userObjects.remove( obj )
    } else {
      console.warn( `Failed to remove object with id: ${id}: no object found.` )
    }
  }

  removeAllObjects() {
    for ( let obj of this.objects ) {
      if ( obj.geometry ){
        obj.geometry.dispose()
      }
    }
    this.solidObjects.clear()
    this.transparentObjects.clear()
    this.objectIds = []

    this._postLoadFunction()
  }

  _postLoadFunction() {
    this.zoomExtents()
    this.viewer.reflectionsNeedUpdate = true
    this.viewer.sectionPlaneHelper._matchSceneSize()
  }

  zoomToObject( target ) {
    const box = new THREE.Box3().setFromObject( target )
    this.zoomToBox( box )
  }

  zoomExtents() {
    let bboxTarget = this.userObjects
    if ( this.objects.length === 0 )  {
      let box = new THREE.Box3( new THREE.Vector3( -1,-1,-1 ), new THREE.Vector3( 1,1,1 ) )
      this.zoomToBox( box )
      return
    }
    let box = new THREE.Box3().setFromObject( bboxTarget )
    this.zoomToBox( box )
  }

  // see this discussion: https://github.com/mrdoob/three.js/pull/14526#issuecomment-497254491
  zoomToBox( box ) {
    const fitOffset = 1.2

    const size = box.getSize( new THREE.Vector3() )
    const center = box.getCenter( new THREE.Vector3() )

    const maxSize = Math.max( size.x, size.y, size.z )
    const fitHeightDistance = maxSize / ( 2 * Math.atan( Math.PI * this.viewer.camera.fov / 360 ) )
    const fitWidthDistance = fitHeightDistance / this.viewer.camera.aspect
    const distance = fitOffset * Math.max( fitHeightDistance, fitWidthDistance )

    const direction = this.viewer.controls.target.clone()
      .sub( this.viewer.camera.position )
      .normalize()
      .multiplyScalar( distance )

    // this.viewer.controls.maxDistance = distance * 20
    this.viewer.controls.target.copy( center )

    this.viewer.camera.near = distance / 100
    this.viewer.camera.far = distance * 100
    this.viewer.camera.updateProjectionMatrix()

    this.viewer.camera.position.copy( this.viewer.controls.target ).sub( direction )

    this.viewer.controls.update()
  }

  _argbToRGB( argb ) {
    return '#'+ ( '000000' + ( argb & 0xFFFFFF ).toString( 16 ) ).slice( -6 )
  }

  _normaliseColor( color ) {
    // Note: full of magic numbers that will need changing once global scene
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
