import * as THREE from 'three'
import SelectionHelper from './SelectionHelper'
import { TransformControls } from './external/TransformControls.js'

export default class SectionBox {

  constructor( viewer, bbox ) {
    this.viewer = viewer

    this.orbiting = false
    this.dragging = false
    this.display = new THREE.Group()
    this.viewer.controls.addEventListener( 'wake', () => { this.orbiting = true } )
    this.viewer.controls.addEventListener( 'controlend', () => { this.orbiting = false } )

    this.box = bbox || this.viewer.sceneManager.getSceneBoundingBox()
    const dimensions = new THREE.Vector3().subVectors( this.box.max, this.box.min )
    this.boxGeo = new THREE.BoxGeometry( dimensions.x, dimensions.y, dimensions.z )

    const matrix = new THREE.Matrix4().setPosition( dimensions.addVectors( this.box.min, this.box.max ).multiplyScalar( 0.5 ) )
    this.boxGeo.applyMatrix4( matrix )
    this.boxMesh = new THREE.Mesh( this.boxGeo, new THREE.MeshBasicMaterial() )

    this.boxHelper = new THREE.BoxHelper( this.boxMesh, 0x0A66FF )

    const plane = new THREE.PlaneGeometry( 1, 1 )
    this.hoverPlane = new THREE.Mesh( plane, new THREE.MeshStandardMaterial( {
      transparent: true,
      side: THREE.DoubleSide,
      opacity: 0.02,
      color: 0x0A66FF,
      metalness: 0.1,
      roughness: 0.75,
    } ) )

    this.display.add( this.boxHelper )
    this.display.add( this.hoverPlane )

    this.viewer.scene.add( this.display )

    this.boxMesh.userData.planes = []
    this.boxMesh.userData.indices = []
    this.planes = []

    // Gen box and planes
    this._generatePlanes()

    // Box face selection controls
    this.selectionHelper = new SelectionHelper( this.viewer, { subset: this.boxMesh, hover: true } )
    let targetFaceIndex = -1

    this.selectionHelper.on( 'hovered', ( obj ) => {
      if ( obj.length === 0 && !this.dragging ) {
        this.hoverPlane.visible = false
        this.controls.visible = true
        this.planeControls.detach()
        this.viewer.controls.enabled = true
        this.viewer.interactions.preventSelection = false
        this.viewer.needsRender = true
        targetFaceIndex = -1
        return
      }
      if ( this.orbiting || this.dragging ) return

      this.controls.visible = false
      this.hoverPlane.visible = true

      let centre = new THREE.Vector3()
      for ( let i = 0; i < 4; i++ ) {
        centre.add( this.boxGeo.vertices[ obj[0].object.userData.indices[ obj[0].faceIndex ][i] ].clone().applyMatrix4( this.boxMesh.matrixWorld ) )
      }
      centre.multiplyScalar( 0.25 )
      this.hoverPlane.position.copy( centre )

      for ( let i = 0; i < 4; i++ ) {
        let vertex = this.boxGeo.vertices[ obj[0].object.userData.indices[ obj[0].faceIndex ][i] ].clone().applyMatrix4( this.boxMesh.matrixWorld )
        this.hoverPlane.geometry.vertices[i].set( vertex.x - centre.x, vertex.y - centre.y , vertex.z - centre.z )
      }

      this.hoverPlane.geometry.verticesNeedUpdate = true

      let normal = obj[0].face.normal
      this.planeControls.showX = normal.x !== 0
      this.planeControls.showY = normal.y !== 0
      this.planeControls.showZ = normal.z !== 0

      this.planeControls.attach( this.hoverPlane )

      if ( obj[0].faceIndex !== targetFaceIndex ) {
        this.viewer.needsRender = true
        targetFaceIndex = obj[0].faceIndex
      }
    } )

    // Whole box controls
    this._globalControlsTarget = new THREE.Mesh( new THREE.SphereGeometry( 0.0001 ), new THREE.MeshBasicMaterial( ) )
    this._globalControlsTarget.position.copy( this.boxGeo.vertices[ 5 ].clone().multiplyScalar( 1.1 ) )
    this.display.add( this._globalControlsTarget )

    this.controls = new TransformControls( this.viewer.camera, this.viewer.renderer.domElement )
    this.controls.setSize( 0.5 )
    this.controls.attach( this._globalControlsTarget )
    this.display.add( this.controls )

    // Section plane controls
    this.planeControls = new TransformControls( this.viewer.camera, this.viewer.renderer.domElement, true )
    this.display.add( this.planeControls )

    this.prevGizmoPos = this._globalControlsTarget.position.clone()
    this.controls.addEventListener( 'change', ( ) => {
      this.prevGizmoPos.sub( this._globalControlsTarget.position )
      this.boxMesh.translateX( -this.prevGizmoPos.x )
      this.boxMesh.translateY( -this.prevGizmoPos.y )
      this.boxMesh.translateZ( -this.prevGizmoPos.z )

      this.prevGizmoPos = this._globalControlsTarget.position.clone()
      this.setPlanesFromBox( new THREE.Box3().setFromObject( this.boxMesh ) )
      this.boxHelper.update()
      this.viewer.needsRender = true
    } )

    this.controls.addEventListener( 'dragging-changed', ( event ) => {
      this.viewer.controls.enabled = !event.value
      this.viewer.interactions.preventSelection = !event.value
      if ( !event.value )
        this.viewer.interactions.zoomToObject( this.boxMesh )
    } )

    let prevPlaneGizmoPos = null
    this.planeControls.addEventListener( 'change', ( ) => {
      if ( !this.dragging ) return
      if ( targetFaceIndex === -1 ) return
      if ( prevPlaneGizmoPos === null ) prevPlaneGizmoPos = this.hoverPlane.position.clone()
      prevPlaneGizmoPos.sub( this.hoverPlane.position )
      let plane = this.boxMesh.userData.planes[ targetFaceIndex ]

      prevPlaneGizmoPos.negate()
      plane.translate( prevPlaneGizmoPos )
      let indices = this.boxMesh.userData.indices[ targetFaceIndex ]
      for ( let i = 0; i < 4; i++ ) {
        let index = indices[i]
        this.boxGeo.vertices[index].add( prevPlaneGizmoPos )
      }
      this.boxGeo.verticesNeedUpdate = true
      this.boxMesh.geometry.computeBoundingBox()
      this.boxMesh.geometry.computeBoundingSphere()

      let gizmoPos = this.boxGeo.vertices[ 5 ].clone()
      gizmoPos.multiplyScalar( 1.1 )
      gizmoPos.applyMatrix4( this.boxMesh.matrixWorld )
      this._globalControlsTarget.position.copy( gizmoPos )
      this.prevGizmoPos = gizmoPos

      prevPlaneGizmoPos = this.hoverPlane.position.clone()
      this.boxHelper.update()
      this.viewer.needsRender = true
    } )

    this.planeControls.addEventListener( 'dragging-changed', ( event ) => {
      this.viewer.controls.enabled = !event.value
      this.viewer.interactions.preventSelection = !event.value
      this.dragging = !!event.value
      if ( !this.dragging ) {
        prevPlaneGizmoPos = null
        this.viewer.interactions.zoomToObject( this.boxMesh )
        targetFaceIndex = -1

      }
      this.viewer.needsRender = true
    } )
  }

  _generatePlanes() {
    for ( let i = 0; i < this.boxGeo.faces.length; i += 2 ) {
      let face = this.boxGeo.faces[i]
      let pairFace = this.boxGeo.faces[i+1]
      let plane = new THREE.Plane()
      // inverting points so plane
      plane.setFromCoplanarPoints( this.boxGeo.vertices[face.c], this.boxGeo.vertices[face.b], this.boxGeo.vertices[face.a] )
      // adding it twice for ease of use
      this.boxMesh.userData.planes.push( plane )
      this.boxMesh.userData.planes.push( plane )

      this.boxMesh.userData.indices.push( [ face.a, face.b, face.c, pairFace.b ] )
      this.boxMesh.userData.indices.push( [ face.a, face.b, face.c, pairFace.b ] )

      this.planes.push( plane )
    }
  }

  setPlanesFromBox( box ) {
    const dimensions = new THREE.Vector3().subVectors( box.max, box.min )
    let boxGeo = new THREE.BoxGeometry( dimensions.x, dimensions.y, dimensions.z )

    const matrix = new THREE.Matrix4().setPosition( dimensions.addVectors( box.min, box.max ).multiplyScalar( 0.5 ) )
    boxGeo.applyMatrix4( matrix )

    for ( let i = 0; i < this.boxGeo.faces.length; i += 2 ) {
      let face = boxGeo.faces[i]
      let plane = this.boxMesh.userData.planes[i]
      plane.setFromCoplanarPoints( boxGeo.vertices[face.c], boxGeo.vertices[face.b], boxGeo.vertices[face.a] ) // invert pts
    }
  }

  setBox( box ) {
    box = box.clone().expandByScalar( 0.5 )
    const dimensions = new THREE.Vector3().subVectors( box.max, box.min )
    let boxGeo = new THREE.BoxGeometry( dimensions.x, dimensions.y, dimensions.z )

    const matrix = new THREE.Matrix4().setPosition( dimensions.addVectors( box.min, box.max ).multiplyScalar( 0.5 ) )
    boxGeo.applyMatrix4( matrix )

    for ( let i = 0; i < this.boxGeo.vertices.length; i++ ) {
      this.boxGeo.vertices[i].copy( boxGeo.vertices[i] )
    }

    this._globalControlsTarget.position.copy( this.boxGeo.vertices[ 5 ].clone().multiplyScalar( 1.1 ) )
    this.prevGizmoPos = this._globalControlsTarget.position.clone()
    this.boxMesh.position.copy( new THREE.Vector3() )
    this.boxMesh.geometry.verticesNeedUpdate = true
    this.boxMesh.geometry.computeBoundingBox()
    this.boxMesh.geometry.computeBoundingSphere()
    this.boxHelper.update()
    this.setPlanesFromBox( box )
    this.viewer.needsRender = true
  }

  toggle() {
    if ( this.display.visible ) {
      this.viewer.renderer.localClippingEnabled = false
      this.display.visible = false
      this.viewer.emit( 'section-box', false )
    } else {
      this.viewer.renderer.localClippingEnabled = true
      this.display.visible = true
      this.viewer.emit( 'section-box', true )
    }
  }

  dispose() {
    this.selectionHelper.dispose()
    this.controls.dispose()
    this.planeControls.dispose()
    this.display.clear()
  }
}
