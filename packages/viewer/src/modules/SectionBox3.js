import * as THREE from 'three'
import SelectionHelper from './SelectionHelper'
// import { FaceNormalsHelper } from 'three/examples/jsm/helpers/FaceNormalsHelper.js'
// import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { TransformControls } from './external/TransformControls.js'

export default class SectionBox {

  constructor( viewer, bbox ) {
    this.viewer = viewer

    this.orbiting = false
    this.viewer.controls.addEventListener( 'wake', () => { this.orbiting = true } )
    this.viewer.controls.addEventListener( 'controlend', () => { this.orbiting = false } )

    this.box = bbox || this.viewer.sceneManager.getSceneBoundingBox()
    const dimensions = new THREE.Vector3().subVectors( this.box.max, this.box.min )
    this.boxGeo = new THREE.BoxGeometry( dimensions.x, dimensions.y, dimensions.z )

    const matrix = new THREE.Matrix4().setPosition( dimensions.addVectors( this.box.min, this.box.max ).multiplyScalar( 0.5 ) )
    this.boxGeo.applyMatrix4( matrix )
    this.boxMesh = new THREE.Mesh( this.boxGeo, new THREE.MeshBasicMaterial( {
      transparent: true,
      opacity: 0.31,
      wireframe: true,
      side: THREE.DoubleSide,
      color: 0x0A66FF
    } ) )

    const plane = new THREE.PlaneGeometry( 1, 1 )
    this.hoverPlane = new THREE.Mesh( plane, new THREE.MeshStandardMaterial( {
      transparent: true,
      side: THREE.DoubleSide,
      opacity: 0.1,
      color: 0x23F3BD,
      metalness: 0.1,
      roughness: 0.75,
    } ) )

    this.display = new THREE.Group()
    this.display.add( this.boxMesh )
    this.boxMesh.attach( this.hoverPlane )
    this.display.add( this.hoverPlane )

    this.viewer.scene.add( this.display )

    let vertex = this.boxGeo.vertices[ 5 ].clone().multiplyScalar( 1.1 )
    let sphereG = new THREE.SphereGeometry( 0.001 )
    this.gizmoSphere = new THREE.Mesh( sphereG, new THREE.MeshBasicMaterial( 0x29308C ) )
    this.gizmoSphere.position.copy( vertex )
    this.display.add( this.gizmoSphere )

    this.boxMesh.userData.planes = []
    this.boxMesh.userData.indices = []
    this.planes = []

    this.controls = new TransformControls( this.viewer.camera, this.viewer.renderer.domElement )
    this.controls.setSize( 0.5 )
    this.controls.attach( this.gizmoSphere )
    this.display.add( this.controls )

    this.planeControls = new TransformControls( this.viewer.camera, this.viewer.renderer.domElement )
    this.planeControls.setSize( 0.5 )
    this.display.add( this.planeControls )

    let prevGizmoPos = this.gizmoSphere.position.clone()
    this.controls.addEventListener( 'change', ( ) => {
      prevGizmoPos.sub( this.gizmoSphere.position )
      this.boxMesh.translateX( -prevGizmoPos.x )
      this.boxMesh.translateY( -prevGizmoPos.y )
      this.boxMesh.translateZ( -prevGizmoPos.z )

      prevGizmoPos = this.gizmoSphere.position.clone()
      this.setFromBox( new THREE.Box3().setFromObject( this.boxMesh ) )
      // this.viewer.render()
      this.viewer.needsRender = true
    } )

    this.controls.addEventListener( 'dragging-changed', ( event ) => {
      this.viewer.controls.enabled = !event.value
    } )

    let prevPlaneGizmoPos = null
    this.planeControls.addEventListener( 'change-xxxx', ( event ) => {
      if ( !this.dragging ) return


      if ( prevIndex === -1 ) return
      if ( prevPlaneGizmoPos === null ) prevPlaneGizmoPos = this.hoverPlane.position.clone()
      prevPlaneGizmoPos.sub( this.hoverPlane.position )
      console.log( prevPlaneGizmoPos )

      let plane = this.boxMesh.userData.planes[ prevIndex ]
      console.log( plane.normal )

      prevPlaneGizmoPos.negate()
      plane.translate( prevPlaneGizmoPos )
      let indices = this.boxMesh.userData.indices[ prevIndex ]
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
      this.gizmoSphere.position.copy( gizmoPos )
      prevGizmoPos = gizmoPos

      prevPlaneGizmoPos = this.hoverPlane.position.clone()
      // this.viewer.render()
      this.viewer.needsRender = true
    } )

    this.keepPlaneGizmo = false
    this.planeControls.addEventListener( 'hover', ( val ) => {
      this.keepPlaneGizmo = val
    } )

    this.planeControls.addEventListener( 'dragging-changed', ( event ) => {
      this.viewer.controls.enabled = !event.value
      this.dragging = !!event.value
      if ( !this.dragging ) {
        prevPlaneGizmoPos = null
        this.viewer.sceneManager.zoomToObject( this.boxMesh )
      }
    } )

    // Gen box and planes
    for ( let i = 0; i < this.boxGeo.faces.length; i += 2 ) {
      let face = this.boxGeo.faces[i]
      let pairFace = this.boxGeo.faces[i+1]
      let plane = new THREE.Plane()
      plane.setFromCoplanarPoints( this.boxGeo.vertices[face.c], this.boxGeo.vertices[face.b], this.boxGeo.vertices[face.a] ) // invert pts

      const helper = new THREE.PlaneHelper( plane, 1, 0xffff00 )
      this.display.add( helper )

      // adding it twice for ease of use
      this.boxMesh.userData.planes.push( plane )
      this.boxMesh.userData.planes.push( plane )

      this.boxMesh.userData.indices.push( [ face.a, face.b, face.c, pairFace.b ] )
      this.boxMesh.userData.indices.push( [ face.a, face.b, face.c, pairFace.b ] )

      this.planes.push( plane )
    }

    this.selectionHelper = new SelectionHelper( this.viewer, { subset: this.boxMesh, hover: true } )

    let prevIndex = -1
    let prevPointer = new THREE.Vector3()

    document.addEventListener( 'pointerup', ( e ) => {
      this.viewer.controls.enabled = true
      if ( this.dragging ) {
        this.viewer.sceneManager.zoomToObject( this.boxMesh )
      }
      this.dragging = false
      this.viewer.renderer.domElement.style.cursor = 'default'
      prevIndex = -1
      prevPointer = new THREE.Vector3()
    } )

    // let faceIndex
    let intPoint = new THREE.Vector3()
    this.selectionHelper.on( 'hovered', ( obj, e ) => {
      if ( obj.length === 0 && !this.dragging ) {
        this.viewer.renderer.domElement.style.cursor = 'default'
        this.hoverPlane.visible = false
        this.controls.visible = true
        this.planeControls.detach()
        this.viewer.controls.enabled = true
        this.viewer.needsRender = true
        prevIndex = -1
        return
      }

      if ( this.orbiting ) return
      if ( this.dragging ) return

      this.controls.visible = false
      this.hoverPlane.visible = true
      intPoint.copy( obj[0].point )
      this.viewer.renderer.domElement.style.cursor = 'pointer'
      let centre = new THREE.Vector3()

      for ( let i = 0; i < 4; i++ ) {
        let vertex = this.boxGeo.vertices[ obj[0].object.userData.indices[ obj[0].faceIndex ][i] ].clone()
        vertex.applyMatrix4( this.boxMesh.matrixWorld )
        centre.add( vertex )
      }
      centre.multiplyScalar( 0.25 )
      this.hoverPlane.position.copy( centre )

      for ( let i = 0; i < 4; i++ ) {
        let vertex = this.boxGeo.vertices[ obj[0].object.userData.indices[ obj[0].faceIndex ][i] ].clone()
        vertex.applyMatrix4( this.boxMesh.matrixWorld )
        this.hoverPlane.geometry.vertices[i].set( vertex.x - centre.x, vertex.y - centre.y , vertex.z - centre.z )
      }

      this.hoverPlane.geometry.verticesNeedUpdate = true
      this.hoverPlane.geometry.computeBoundingBox()
      this.hoverPlane.geometry.computeBoundingSphere()


      let normal = obj[0].face.normal
      this.planeControls.showX = normal.x !== 0
      this.planeControls.showY = normal.y !== 0
      this.planeControls.showZ = normal.z !== 0

      this.planeControls.attach( this.hoverPlane )
      // if(normal.z !== 0 ) this.planeControls.showZ

      if ( obj[0].faceIndex !== prevIndex ) {
        this.viewer.needsRender = true
        prevIndex = obj[0].faceIndex
      }
    } )

    this.selectionHelper.on( 'object-drag', ( obj, e ) => {
      // return
      if ( this.orbiting || !this.display.visible ) return
      if ( prevIndex === -1 ) return

      this.dragging = true
      this.viewer.renderer.domElement.style.cursor = 'move'
      this.viewer.controls.enabled = false

      let plane = this.boxMesh.userData.planes[ prevIndex ]
      let indices = this.boxMesh.userData.indices[ prevIndex ]
      let centre = new THREE.Vector3()
      for(let indx of indices) centre.add( this.boxGeo.vertices[indx])
      centre.multiplyScalar(0.25)
      let projectionPlane = new THREE.Plane()
      projectionPlane.setFromNormalAndCoplanarPoint( this.viewer.camera.getWorldDirection( projectionPlane.normal ), intPoint )

      if ( prevPointer.equals( new THREE.Vector3() ) ) prevPointer = new THREE.Vector3( e.x, e.y, 0 )
      let currentPointer = new THREE.Vector3( e.x, e.y, 0 )
      let mouseDeltaVector = prevPointer.clone().sub( currentPointer )

      let displacement = mouseDeltaVector.clone().projectOnPlane( projectionPlane.normal )
      displacement.projectOnVector( plane.normal )

      console.log( displacement )

      // let indices = this.boxMesh.userData.indices[ prevIndex ]
      for ( let i = 0; i < 4; i++ ) {
        let index = indices[i]
        this.boxMesh.geometry.vertices[index].add( displacement )
        this.hoverPlane.geometry.vertices[i].add( displacement )
      }

      this.boxMesh.geometry.verticesNeedUpdate = true
      this.boxMesh.geometry.computeBoundingBox()
      this.boxMesh.geometry.computeBoundingSphere()
      this.hoverPlane.geometry.verticesNeedUpdate = true
      // this.hoverPlane.geometry.computeBoundingBox()
      // this.hoverPlane.geometry.computeBoundingSphere()

      // let gizmoPos = this.boxGeo.vertices[ 5 ].clone()
      // gizmoPos.multiplyScalar( 1.1 )
      // gizmoPos.applyMatrix4( this.boxMesh.matrixWorld )
      // this.gizmoSphere.position.copy( gizmoPos )
      // prevGizmoPos = gizmoPos

      this.viewer.needsRender = true
      prevPointer = currentPointer.clone()
    } )
  }

  setFromBox( box ) {
    const dimensions = new THREE.Vector3().subVectors( box.max, box.min )
    let boxGeo = new THREE.BoxGeometry( dimensions.x, dimensions.y, dimensions.z )

    const matrix = new THREE.Matrix4().setPosition( dimensions.addVectors( box.min, box.max ).multiplyScalar( 0.5 ) )
    boxGeo.applyMatrix4( matrix )

    for ( let i = 0; i < this.boxGeo.faces.length; i += 2 ) {
      let face = boxGeo.faces[i]
      let plane = this.boxMesh.userData.planes[i]
      plane.setFromCoplanarPoints( boxGeo.vertices[face.c], boxGeo.vertices[face.b], boxGeo.vertices[face.a] ) // invert pts
    }

    this.boxMesh.geometry.verticesNeedUpdate = true
    // TODO: gizmo moving
  }

  dispose() {
    this.selectionHelper.dispose()
    this.display.clear()
  }
}
