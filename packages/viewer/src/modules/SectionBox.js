import * as THREE from 'three'
// import { DragControls } from 'three/examples/jsm/controls/DragControls.js'

import SelectionHelper from './SelectionHelper'

/**
 * Section box helper for Speckle Viewer
 *
 */

// indices to verts in this.boxGeo - box edges
const edges = [
  [ 0,1 ], [ 1,3 ],
  [ 3,2 ], [ 2,0 ],
  [ 4,6 ], [ 6,7 ],
  [ 7,5 ], [ 5,4 ],
  [ 2,7 ], [ 0,5 ],
  [ 1,4 ], [ 3,6 ]
]

export default class SectionBox {
  constructor( viewer, _vis ) {
    //defaults to invisible
    let vis = _vis || false

    this.viewer = viewer
    this.orbiting = false
    this.viewer.controls.addEventListener( 'wake', () => { this.orbiting = true } )
    this.viewer.controls.addEventListener( 'controlend', () => { this.orbiting = false } )

    this.display = new THREE.Group()
    this.display.visible = vis

    this.displayBox = new THREE.Group()
    this.displayEdges = new THREE.Group()
    this.displayHover = new THREE.Group()

    this.display.add( this.displayBox )
    this.display.add( this.displayEdges )
    this.display.add( this.displayHover )

    this.viewer.scene.add( this.display )

    // basic display of the section box
    this.boxMaterial = new THREE.MeshStandardMaterial( {
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      color: 0x0A66FF,
      metalness: 0.01,
      roughness: 0.75,
    } )

    // the box itself
    this.boxGeo = new THREE.BoxGeometry( 2,2,2 )
    this.boxMesh = new THREE.Mesh( this.boxGeo, this.boxMaterial )

    this.boxMesh.geometry.computeBoundingBox()
    this.boxMesh.geometry.computeBoundingSphere()
    this.displayBox.add( this.boxMesh )

    // const edges = new THREE.EdgesGeometry( this.boxGeo )
    // this.line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0xDF66FF } ) )


    // normal of plane being hovered
    this.hoverPlane = new THREE.Vector3()

    this.selectionHelper = new SelectionHelper( this.viewer, { subset: this.displayBox, hover:true } )

    // pointer position
    this.pointer = new THREE.Vector3()
    this.dragging = false

    // planes face inward
    // indices correspond to vertex indices on the boxGeometry
    // constant is set to 1 + epsilon to prevent planes from clipping section box display
    this.planes = [
      {
        axis: '+x', // right, x positive
        plane: new THREE.Plane( new THREE.Vector3( 1, 0, 0 ), 0 ),
        indices: [ 5,4,6,7 ],
      },{
        axis: '-x', // left, x negative
        plane: new THREE.Plane( new THREE.Vector3( -1, 0, 0 ), 0 ),
        indices: [ 0,1,3,2 ],
      },{
        axis: '+y', // out, y positive
        plane:new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), 0 ),
        indices: [ 2,3,6,7 ],
      },{
        axis: '-y', // in, y negative
        plane:new THREE.Plane( new THREE.Vector3( 0, -1, 0 ), 0 ),
        indices: [ 5,4,1,0 ],
      },{
        axis: '+z', // up, z positive
        plane:new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), 0 ),
        indices: [ 1,3,6,4 ],
      },{
        axis: '-z', // down, z negative
        plane:new THREE.Plane( new THREE.Vector3( 0, 0, -1 ), 0 ),
        indices: [ 0,2,7,5 ],
      } ]

    // this.planes.forEach( p => {
    //   const helper = new THREE.PlaneHelper( p.plane, 1, 0xffff00 )
    //   this.display.add( helper )
    // } )

    this.viewer.sceneManager.objects.forEach( obj => {
      obj.material.clippingPlanes = this.planes.map( c => c.plane )
    } )

    this.hoverMat = new THREE.MeshStandardMaterial( {
      transparent: true,
      opacity: 0.1,
      color: 0x0A66FF,
      metalness: 0.1,
      roughness: 0.75,
    } )

    // Selection Helper seems unecessary for this type of thing
    this.viewer.renderer.domElement.addEventListener( 'pointerup', ( e ) => {
      this.pointer = new THREE.Vector3()
      this.tempVerts = []
      this.viewer.controls.enabled = true
      this.dragging = false
    } )

    let cuttingPlane = null
    let hoverPlane = null

    // hovered event handler
    this.selectionHelper.on( 'hovered', ( obj, e ) => {
      if ( this.orbiting ) return

      if ( obj.length === 0 && !this.dragging ) {
        this.viewer.controls.enabled = true
        this.displayHover.clear()
        this.hoverPlane = new THREE.Vector3()
        this.viewer.controls.enabled = true
        this.viewer.renderer.domElement.style.cursor = 'default'
        return
      } else if ( this.dragging ) {
        return
      }

      this.viewer.controls.enabled = false
      this.viewer.renderer.domElement.style.cursor = 'pointer'

      switch ( obj[0].faceIndex ) {
      case 0: case 1:
        cuttingPlane = this.planes[0]
        hoverPlane = this.planes[1]
        break
      case 2: case 3:
        cuttingPlane = this.planes[1]
        hoverPlane = this.planes[0]
        break
      case 4: case 5:
        cuttingPlane = this.planes[2]
        hoverPlane = this.planes[3]
        break
      case 6: case 7:
        cuttingPlane = this.planes[3]
        hoverPlane = this.planes[2]
        break
      case 8: case 9:
        cuttingPlane = this.planes[4]
        hoverPlane = this.planes[5]
        break
      case 10: case 11:
        cuttingPlane = this.planes[5]
        hoverPlane = this.planes[4]
        break
      }

      // this.hoverPlane = plane.normal.clone()
      this.updateHover( hoverPlane )
    } )

    // get screen space vector of plane normal
    // project mouse displacement vector onto it
    // move plane by that much
    this.selectionHelper.on( 'object-drag', ( obj, e ) => {
      if ( this.orbiting ) return
      if ( !this.display.visible ) return

      // exit if we don't have a valid hoverPlane
      // if ( this.hoverPlane.equals( new THREE.Vector3() ) ) return
      // exit if we're clicking on nothing
      if ( !obj.length && !this.dragging ) return

      this.viewer.controls.enabled = false
      this.viewer.renderer.domElement.style.cursor = 'move'

      this.dragging = true

      let plane = hoverPlane.plane

      if ( this.pointer.equals( new THREE.Vector3() ) ) {
        this.pointer = new THREE.Vector3( e.x, e.y, 0.0 )
      }

      // screen space normal vector
      // bad transformations of camera can corrupt this
      let ssNorm = plane.normal.clone()
      ssNorm.negate().project( this.viewer.camera )
      ssNorm.setComponent( 2, 0 ).normalize()

      // mouse displacement
      let mD = this.pointer.clone().sub( new THREE.Vector3( e.x, e.y, 0.0 ) )
      this.pointer = new THREE.Vector3( e.x, e.y, 0.0 )

      // quantity of mD on ssNorm
      let d = ( ssNorm.dot( mD ) / ssNorm.lengthSq() )

      // configurable drag speed
      let zoom = this.viewer.camera.getWorldPosition( new THREE.Vector3() ).sub( new THREE.Vector3() ).length()
      zoom *= 0.75
      d = d * zoom

      // limit plane from crossing it's pair
      let planeObjOpp = cuttingPlane
      let dist = hoverPlane.plane.constant + planeObjOpp.plane.constant
      let displacement = new THREE.Vector3( d,d,d ).multiply( plane.normal )
      // are we moving towards the limiting plane?
      let dot = displacement.clone().normalize().dot( plane.normal )
      if ( dist < 0.1 && dot < 0 ) return


      cuttingPlane.plane.translate( displacement )
      this.updateBoxFace( hoverPlane, displacement )
      this.updateHover( hoverPlane )

      this.viewer.needsRender = true
    } )
  }

  // boxMesh = bbox
  setFromBbox( bbox, offset ){
    bbox = bbox.clone()

    // add a little padding to the box
    const size = bbox.getSize( new THREE.Vector3() )
    if ( offset )
      bbox.expandByVector( size.multiplyScalar( offset ) )

    const dimensions = new THREE.Vector3().subVectors( bbox.max, bbox.min )
    const boxGeo = new THREE.BoxGeometry( dimensions.x, dimensions.y, dimensions.z )
    const matrix = new THREE.Matrix4().setPosition( dimensions.addVectors( bbox.min, bbox.max ).multiplyScalar( 0.5 ) )
    boxGeo.applyMatrix4( matrix )

    let k = 0
    for ( let i = 0; i < boxGeo.faces.length; i += 2 ) {
      let plane = this.planes[k]
      let face = boxGeo.faces[i]

      plane.plane.setFromCoplanarPoints( boxGeo.vertices[face.c], boxGeo.vertices[face.b], boxGeo.vertices[face.a] )
      k++
    }

    // update box geometry
    for ( let i = 0; i< boxGeo.vertices.length; i++ ) {
      let vert = boxGeo.vertices[i]
      this.boxMesh.geometry.vertices[i].set( vert.x, vert.y, vert.z )
    }

    this.boxMesh.geometry.verticesNeedUpdate = true
    this.boxMesh.geometry.computeBoundingBox()
    this.boxMesh.geometry.computeBoundingSphere()

    const edges = new THREE.EdgesGeometry( this.boxMesh.geometry )
    const line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0xffffff } ) )
    this.displayEdges.add( line )
  }


  updateBoxFace( planeObj, displacement ){
    this.boxMesh.geometry.vertices.map( ( v,i ) => {
      if ( !planeObj.indices.includes( i ) ) return
      this.boxMesh.geometry.vertices[i].add( displacement )
    } )

    this.boxMesh.geometry.verticesNeedUpdate = true
    this.boxMesh.geometry.computeBoundingBox()
    this.boxMesh.geometry.computeBoundingSphere()

    // this.updateEdges()
  }

  updateHover( planeObj ){
    this.displayHover.clear()
    let verts = this.boxMesh.geometry.vertices.filter( ( v, i ) => planeObj.indices.includes( i ) )

    let centroid = verts[0].clone()
      .add( verts[1] )
      .add( verts[2] )
      .add( verts[3] )

    centroid.multiplyScalar( 0.25 )

    let dims = verts[0].clone().sub( centroid ).multiplyScalar( 2 ).toArray().filter( v => v !== 0 )
    let width = Math.abs( dims[0] )
    let height = Math.abs( dims[1] )

    let hoverGeo = new THREE.PlaneGeometry( width, height )

    // orients hover geometry to box face
    switch ( planeObj.axis ){
    case '-x':
      hoverGeo.rotateY( Math.PI / 2 )
      hoverGeo.rotateX( Math.PI / 2 )
      break
    case '+x':
      hoverGeo.rotateY( -Math.PI / 2 )
      hoverGeo.rotateX( -Math.PI / 2 )
      break
    case '-y':
      hoverGeo.rotateX( -Math.PI / 2 )
      break
    case '+y':
      hoverGeo.rotateX( Math.PI / 2 )
      break
    default:
      break
    }

    // translation
    centroid.add( this.boxMesh.position )

    hoverGeo.translate( centroid.x, centroid.y, centroid.z )

    let hoverMesh = new THREE.Mesh( hoverGeo, this.hoverMat )
    this.displayHover.add( hoverMesh )
    this.viewer.needsRender = true
  }

  toggleSectionBox( _bool ){
    let bool = _bool || !this.visible
    this.visible = bool
    this.display.visible = bool
    this.viewer.needsRender = true
  }
}
