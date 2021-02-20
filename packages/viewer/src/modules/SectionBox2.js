import * as THREE from 'three'
import SelectionHelper from './SelectionHelper'
import { FaceNormalsHelper } from 'three/examples/jsm/helpers/FaceNormalsHelper.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'

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
      opacity: 0.3,
      color: 0x23F3BD,
      metalness: 0.1,
      roughness: 0.75,
    } ) )

    this.display = new THREE.Group()
    this.display.add( this.boxMesh )
    this.boxMesh.attach( this.hoverPlane )
    this.display.add( this.hoverPlane )

    this.viewer.scene.add( this.display )


    let vertex = this.boxGeo.vertices[ 5 ].clone().addScalar( 0.1 )
    // vertex.addScalar( 0.1 )
    let sphereG = new THREE.SphereGeometry( 0.001 )
    this.gizmoSphere = new THREE.Mesh( sphereG, new THREE.MeshBasicMaterial( 0x29308C ) )
    this.gizmoSphere.position.copy( vertex )
    this.display.add( this.gizmoSphere )

    this.boxMesh.userData.planes = []
    this.boxMesh.userData.indices = []
    this.planes = []

    // this.normalHelper = new FaceNormalsHelper( this.boxMesh, 2, 0x00ff00, 1 )
    // this.display.add( this.normalHelper )

    this.controls = new TransformControls( this.viewer.camera, this.viewer.renderer.domElement )
    this.controls.setSize( 0.5 )
    this.controls.attach( this.gizmoSphere )
    this.display.add( this.controls )

    this.planeControls = new TransformControls( this.viewer.camera, this.viewer.renderer.domElement )
    // this.planeControls.attach( this.hoverPlane )
    // this.planeControls.visible = false
    this.display.add( this.planeControls )

    let prevGizmoPos = this.gizmoSphere.position.clone()
    this.controls.addEventListener( 'change', ( event ) => {
      prevGizmoPos.sub( this.gizmoSphere.position )
      this.boxMesh.translateX( -prevGizmoPos.x )
      this.boxMesh.translateY( -prevGizmoPos.y )
      this.boxMesh.translateZ( -prevGizmoPos.z )

      prevGizmoPos = this.gizmoSphere.position.clone()
      this.setFromBox( new THREE.Box3().setFromObject( this.boxMesh ) )
      this.viewer.render()
    } )

    this.controls.addEventListener( 'dragging-changed', ( event ) => {
      this.viewer.controls.enabled = !event.value
      // if ( this.viewer.controls.enabled ) this.viewer.sceneManager.zoomToObject( this.boxMesh )
    } )

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
    this.selectionHelper.on( 'hovered', ( obj, e ) => {
      if ( obj.length === 0 && !this.dragging ) {
        this.viewer.renderer.domElement.style.cursor = 'default'
        this.hoverPlane.visible = false
        this.planeControls.detach()
        this.viewer.controls.enabled = true
        this.viewer.needsRender = true
        prevIndex = -1
        return
      }
      if ( this.orbiting ) return
      if ( this.dragging ) return

      this.hoverPlane.visible = true

      this.viewer.renderer.domElement.style.cursor = 'pointer'
      let centre = new THREE.Vector3()
      for ( let i = 0; i < 4; i++ ) {
        let vertex = this.boxGeo.vertices[ obj[0].object.userData.indices[ obj[0].faceIndex ][i] ].clone()
        let vertexClone = vertex.clone()
        vertex.applyMatrix4( this.boxMesh.matrixWorld )
        centre.add( vertex )
        this.hoverPlane.geometry.vertices[i].set( vertexClone.x / 4, vertexClone.y /4 , vertexClone.z/4 )
      }
      centre.multiplyScalar( 0.25 )
      this.hoverPlane.position.copy( centre )
      this.hoverPlane.geometry.verticesNeedUpdate = true
      this.hoverPlane.geometry.computeBoundingBox()
      this.hoverPlane.geometry.computeBoundingSphere()

      this.planeControls.attach( this.hoverPlane )

      if ( obj[0].faceIndex !== prevIndex ){
        this.viewer.needsRender = true
        prevIndex = obj[0].faceIndex
      }
    } )

    this.selectionHelper.on( 'object-drag', ( obj, e ) => {
      if ( this.orbiting || !this.display.visible ) return
      if ( prevIndex === -1 ) return

      this.dragging = true
      this.viewer.renderer.domElement.style.cursor = 'move'
      this.viewer.controls.enabled = false

      let plane = this.boxMesh.userData.planes[ prevIndex ]
      let normal = plane.normal.clone()
      this.viewer.camera.updateMatrixWorld()
      normal.negate().project( this.viewer.camera )
      normal.setComponent( 2, 0 ).normalize()

      if ( prevPointer.equals( new THREE.Vector3() ) ) prevPointer = new THREE.Vector3( e.x, e.y, 0 )

      let currentPointer = new THREE.Vector3( e.x, e.y, 0 )
      let mouseDeltaVector = prevPointer.clone().sub( currentPointer )

      let dot = normal.dot( mouseDeltaVector )

      const bbox = new THREE.Box3().setFromObject( this.boxMesh )
      const dims = new THREE.Vector3().subVectors( bbox.max, bbox.min )
      if ( dot > 0 && ( dims.x < 0.2 || dims.y < 0.2 || dims.z < 0.2 ) ) return

      let zoom = this.viewer.camera.getWorldPosition( new THREE.Vector3() ).sub( new THREE.Vector3() ).length()
      zoom *= 0.5
      dot *= zoom

      let displacement = new THREE.Vector3( dot, dot, dot ).multiply( plane.normal )

      plane.translate( displacement )

      let indices = this.boxMesh.userData.indices[ prevIndex ]
      for ( let i = 0; i < 4; i++ ) {
        let index = indices[i]
        this.boxMesh.geometry.vertices[index].add( displacement )
        this.hoverPlane.geometry.vertices[i].add( displacement )
      }

      this.boxMesh.geometry.verticesNeedUpdate = true
      this.boxMesh.geometry.computeBoundingBox()
      this.boxMesh.geometry.computeBoundingSphere()
      this.hoverPlane.geometry.verticesNeedUpdate = true
      this.hoverPlane.geometry.computeBoundingBox()
      this.hoverPlane.geometry.computeBoundingSphere()

      let gizmoPos = this.boxGeo.vertices[ 5 ].clone()
      gizmoPos.addScalar( 0.1 )
      gizmoPos.applyMatrix4( this.boxMesh.matrixWorld )
      this.gizmoSphere.position.copy( gizmoPos )
      prevGizmoPos = gizmoPos

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
