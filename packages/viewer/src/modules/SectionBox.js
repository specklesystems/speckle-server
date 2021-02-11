import * as THREE from 'three'

import SelectionHelper from './SelectionHelper'

/**
 * Section box helper for Speckle Viewer
 * 
 */

// indices to verts in this.boxGeo - box edges
const edges = [
  [0,1], [1,3],
  [3,2], [2,0],
  [4,6], [6,7],
  [7,5], [5,4],
  [2,7], [0,5],
  [1,4], [3,6]
]

export default class SectionBox {
  constructor(viewer, _vis){
    //defaults to invisible
    let vis = _vis || false

    this.viewer = viewer
    
    this.display = new THREE.Group()
    this.display.visible = vis

    this.displayBox = new THREE.Group()
    this.displayEdges = new THREE.Group()
    this.displayHover = new THREE.Group()

    this.display.add(this.displayBox)
    this.display.add(this.displayEdges)
    this.display.add(this.displayHover)

    this.viewer.scene.add(this.display)

    // basic display of the section box
    this.boxMaterial = new THREE.MeshBasicMaterial({
                                      // transparent:true,
                                      // color: 0xffe842, 
                                      // opacity: 0.5
                                    })
                  
    // the box itself
    this.boxGeo = new THREE.BoxGeometry(2,2,2)
    this.boxMesh = new THREE.Mesh(this.boxGeo, this.boxMaterial)    
    this.boxMesh.visible = false
    this.boxMesh.geometry.computeBoundingBox();
    this.boxMesh.geometry.computeBoundingSphere();
    this.displayBox.add(this.boxMesh)
    
    this.lineMaterial = new THREE.LineDashedMaterial({
      color: 0x000000,
      linewidth: 4,
    })

    // show box edges
    edges.map(val => {
      let pts = [this.boxGeo.vertices[val[0]].clone(),
                 this.boxGeo.vertices[val[1]].clone()]
      let geo = new THREE.BufferGeometry().setFromPoints(pts)
      let line = new THREE.Line(geo, this.lineMaterial)
      this.displayEdges.add(line)
    })
    
    // normal of plane being hovered
    this.hoverPlane = new THREE.Vector3()

    this.selectionHelper = new SelectionHelper( this.viewer, {subset:this.displayBox, hover:true} )

    // pointer position
    this.pointer = new THREE.Vector3()
    this.dragging = false
    
    // planes face inward
    // indices correspond to vertex indices on the boxGeometry
    // constant is set to 1 + epsilon to prevent planes from clipping section box display
    this.planes = [
      {
        axis: '+x', // right, x positive
        plane:new THREE.Plane( new THREE.Vector3( 1, 0, 0 ), 1 ),
        indices: [5,4,6,7],
      },{
        axis: '-x', // left, x negative
        plane: new THREE.Plane( new THREE.Vector3( - 1, 0, 0 ), 1 ),
        indices: [0,1,3,2],
      },{
        axis: '+y', // out, y positive
        plane:new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), 1 ),   
        indices: [2,3,6,7],
      },{
        axis: '-y', // in, y negative
        plane:new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), 1 ),
        indices: [5,4,1,0],
      },{
        axis: '+z', // up, z positive
        plane:new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), 1 ),
        indices: [1,3,6,4],
      },{
        axis: '-z', // down, z negative
        plane:new THREE.Plane( new THREE.Vector3( 0, 0, - 1 ), 1 ),
        indices: [0,2,7,5],
      }];

    // plane helpers
    // this.planeHelpers = this.planes.map( p => this.display.add(new THREE.PlaneHelper( p.plane, 2, 0x000000 ) ));
    
    // adds clipping planes to all materials
    // better to add clipping planes to renderer
    this.viewer.renderer.localClippingEnabled = true

    let objs = this.viewer.sceneManager.objects
    objs.forEach( obj => {
      obj.material.clippingPlanes = this.planes.map( c => c.plane )
    } )
    
    this.hoverMat = new THREE.MeshStandardMaterial( {
      transparent: true,
      opacity: 0.6,
      color: 0xffe842,
      // color: 0xE91E63,
      metalness: 0.1,
      roughness: 0.75,
    } ); 

    // hovered event handler
    this.selectionHelper.on('hovered', (obj, e) => {
      
      if(obj.length === 0 && !this.dragging) {
        this.displayHover.clear()
        this.hoverPlane = new THREE.Vector3()
        this.viewer.controls.enabled = true
        this.viewer.renderer.domElement.style.cursor = 'default'
        return;
      } else if (this.dragging){
        return
      }

      this.viewer.renderer.domElement.style.cursor = 'pointer';
      
      let index = this.planes.findIndex(p => p.plane.normal.equals(obj[0].face.normal.clone().negate()))
      if(index < 0) return // this should never be the case?
      let planeObj = this.planes[index]
      let plane = planeObj.plane
      
      if(plane.normal.equals(this.hoverPlane)) return
      this.hoverPlane = plane.normal.clone()
      
      this.updateHover(planeObj)
    })

    // Selection Helper seems unecessary for this type of thing
    this.viewer.renderer.domElement.addEventListener('pointerup', (e) => {
      this.pointer = new THREE.Vector3()
      this.tempVerts = []
      this.viewer.controls.enabled = true
      this.dragging = false
    })

    // get screen space vector of plane normal
    // project mouse displacement vector onto it
    // move plane by that much
    this.selectionHelper.on('object-drag', (obj, e) => {
      // exit if we don't have a valid hoverPlane
      if(this.hoverPlane.equals(new THREE.Vector3())) return
      // exit if we're clicking on nothing
      if(!obj.length && !this.dragging) return

      this.viewer.controls.enabled = false
      this.viewer.renderer.domElement.style.cursor = 'move';

      this.dragging = true
      
      let index = this.planes.findIndex(p => p.plane.normal.equals(this.hoverPlane))
      let planeObj = this.planes[index]
      let plane = planeObj.plane

      if(this.pointer.equals(new THREE.Vector3())) {
        this.pointer = new THREE.Vector3(e.x, e.y, 0.0)
      }
      
      // screen space normal vector
      // bad transformations of camera can corrupt this
      let ssNorm = plane.normal.clone()
      ssNorm.negate().project(this.viewer.camera)
      ssNorm.setComponent(2, 0).normalize()

      // mouse displacement
      let mD = this.pointer.clone().sub(new THREE.Vector3(e.x, e.y, 0.0))
      this.pointer = new THREE.Vector3(e.x, e.y, 0.0)

      // quantity of mD on ssNorm
      let d = (ssNorm.dot(mD) / ssNorm.lengthSq())

      // configurable drag speed
      let zoom = this.viewer.camera.getWorldPosition(new THREE.Vector3()).sub(new THREE.Vector3()).length()
      zoom *= 0.75
      d = d * zoom
      
      // limit plane from crossing it's pair
      let hoverOpp = this.hoverPlane.clone().negate()
      let indexOpp = this.planes.findIndex(p => p.plane.normal.equals(hoverOpp))
      let planeObjOpp = this.planes[indexOpp]
      let dist = planeObj.plane.constant + planeObjOpp.plane.constant

      let displacement = new THREE.Vector3(d,d,d).multiply(plane.normal)
      // are we moving towards the limiting plane?
      let dot = displacement.clone().normalize().dot(plane.normal)

      // if displacement + padding is greater than limit,
      // and we're moving towards the limiting plane
      if(dist < d && dot > 0) {
        d = dist * 0.001
        displacement = new THREE.Vector3(d,d,d).multiply(plane.normal)
      }

      plane.translate(displacement)
      this.updateBoxFace(planeObj, displacement)
      this.updateHover(planeObj)

    })
  }

  // boxMesh = bbox
  setFromBbox(bbox){
    // add a little padding to the box
    bbox.max.addScalar(10)
    bbox.min.subScalar(10)
    for(let p of this.planes) {
      // reset plane
      // p.plane.set(p.plane.normal, 1)
      let c = 0
      // planes point inwards - if negative select max part of bbox
      if ( p.plane.normal.dot(new THREE.Vector3(1,1,1)) > 0 ) {
        c = p.plane.normal.clone().multiply(bbox.min)
      } else {
        c = p.plane.normal.clone().multiply(bbox.max)
      }
      let diff = c.length() - p.plane.constant

      // displacement
      let d = p.plane.normal.clone().negate().multiplyScalar(diff)

      this.updateBoxFace(p, d)
      p.plane.translate(d)
    }
  }

  updateBoxFace(planeObj, displacement){
    this.boxMesh.geometry.vertices.map((v,i) => {
      if(!planeObj.indices.includes(i)) return
      this.boxMesh.geometry.vertices[i].add(displacement)
    })

    this.boxMesh.geometry.verticesNeedUpdate = true
    this.boxMesh.geometry.computeBoundingBox();
    this.boxMesh.geometry.computeBoundingSphere();

    this.updateEdges()
  }

  updateEdges(){
    this.displayEdges.clear()
    edges.map(val => {
      let ptA = this.boxMesh.geometry.vertices[val[0]].clone()
      let ptB = this.boxMesh.geometry.vertices[val[1]].clone()
      // translation
      ptA.add(this.boxMesh.position)
      ptB.add(this.boxMesh.position)
      this.drawLine([ptA, ptB])
    })
  }

  drawLine(pts){
    let geo = new THREE.BufferGeometry().setFromPoints(pts)
    let line = new THREE.Line(geo, this.lineMaterial)
    this.displayEdges.add(line)
  }

  updateHover(planeObj){
    this.displayHover.clear()
    let verts = this.boxMesh.geometry.vertices.filter((v, i) => planeObj.indices.includes(i))

    let centroid = verts[0].clone()
                           .add(verts[1])
                           .add(verts[2])
                           .add(verts[3])

    centroid.multiplyScalar(0.25)
    
    let dims = verts[0].clone().sub(centroid).multiplyScalar(2).toArray().filter(v=> v !== 0)
    let width = Math.abs(dims[0])
    let height = Math.abs(dims[1])

    let hoverGeo = new THREE.PlaneGeometry(width, height)

    // orients hover geometry to box face
    switch(planeObj.axis){
      case '-x':
        hoverGeo.rotateY(Math.PI / 2)
        hoverGeo.rotateX(Math.PI / 2)
        break
      case '+x':
        hoverGeo.rotateY(-Math.PI / 2)
        hoverGeo.rotateX(-Math.PI / 2)
        break
      case '-y':
        hoverGeo.rotateX(- Math.PI / 2)
        break
      case '+y':
        hoverGeo.rotateX(Math.PI / 2)
        break
      default:
        break
    }

    // translation
    centroid.add(this.boxMesh.position)

    hoverGeo.translate(centroid.x, centroid.y, centroid.z)

    let hoverMesh = new THREE.Mesh(hoverGeo, this.hoverMat)
    this.displayHover.add(hoverMesh)
  }

  toggleSectionBox(_bool){
    let bool = _bool || !this.visible
    this.visible = bool
    this.display.visible = bool

    // what's the tradeoff for having the clipping planes in material vs in the renderer?
    // this.viewer.renderer.clippingPlanes = bool ? this.planes.reduce((p,c) => [...p,c.plane],[]) : []
  }
}