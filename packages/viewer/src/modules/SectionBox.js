import * as THREE from 'three'

import SelectionHelper from './SelectionHelper'

/**
 * Class that implements a section box
 * _bbox is optional parameter that sets initial size
 * 
 * 
 * 
 * 
 * 
 * 
 */

// indices to verts in this.box
// these allow for drawing of box edges
const edges = [
  [0,1], [1,3],
  [3,2], [2,0],
  [4,6], [6,7],
  [7,5], [5,4],
  [2,7], [0,5],
  [1,4], [3,6]
]

export default class SectionBox {
  constructor(viewer){
    this.viewer = viewer

    this.display = new THREE.Group()
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
                                      // opacity: 0.00
                                    })
                  
    // the box itself
    this.boxGeo = new THREE.BoxGeometry(2,2,2)
    this.boxMesh = new THREE.Mesh(this.boxGeo, this.boxMaterial)    
    this.boxMesh.visible = false // surprised raycasting still works when visible = false
    this.boxMesh.name = 'section-box'

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

    this.selectionHelper = new SelectionHelper( this.viewer, {subset:'section-box', hover:true} )

    // pointer position
    this.pointer = new THREE.Vector3()
    this.dragging = false
    
    // planes face outwards
    // indices correspond to vertex indices on the boxGeometry
    this.planes = [
      {
        // right, x positive
        axis: '+x',
        plane:new THREE.Plane( new THREE.Vector3( 1, 0, 0 ), 1 ),
        indices: [5,4,6,7],
      },{
        // left, x negative
        axis: '-x',
        plane: new THREE.Plane( new THREE.Vector3( - 1, 0, 0 ), 1 ),
        indices: [0,1,3,2],
      },{
        // out, y positive
        axis: '+y',
        plane:new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), 1 ),   
        indices: [2,3,6,7],
      },{
        // in, y negative
        axis: '-y',
        plane:new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), 1 ),
        indices: [5,4,1,0],
      },{
        // up, z positive
        axis: '+z',
        plane:new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), 1 ),
        indices: [1,3,6,4],
      },{
        // down, z negative
        axis: '-z',
        plane:new THREE.Plane( new THREE.Vector3( 0, 0, - 1 ), 1 ),
        indices: [0,2,7,5],
      }];

    // plane helpers
    this.planeHelpers = this.planes.map( p => this.display.add(new THREE.PlaneHelper( p.plane, 2, 0x000000 ) ));
    
    this.viewer.renderer.localClippingEnabled = true
    // adds local clipping planes to all materials
    let objs = this.viewer.sceneManager.objects
    objs.forEach( obj => {
      obj.material.clippingPlanes = this.planes.map( c => c.plane )
    } )
    
    this.hoverMat = new THREE.MeshStandardMaterial( {
      transparent: true,
      opacity: 0.75,
      color: 0xE91E63,
      metalness: 0.1,
      roughness: 0.75,
      side: THREE.DoubleSide
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
      // console.log(obj[0].face.normal)
      // console.log(obj[0].face.normal.clone().negate())
      // console.log(this.planes.find(p => p.plane.normal.equals(obj[0].face.normal.clone().negate())))
      let index = this.planes.findIndex(p => p.plane.normal.equals(obj[0].face.normal.clone().negate()))
      if(index < 0) return // this should never be the case?
      let planeObj = this.planes[index]
      let plane = planeObj.plane
      
      if(plane.normal.equals(this.hoverPlane)) return
      this.hoverPlane = plane.normal.clone()
      
      this.updateHover(planeObj)
    })

    // this.selectionHelper.on('object-clicked', (e) => {
    //   // console.log("object-clicked")

    // })

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
      console.log(plane.normal)
      if(this.pointer.equals(new THREE.Vector3())) {
        this.pointer = new THREE.Vector3(e.x, e.y, 0.0)
      }

      // screen space normal vector
      let ssNorm = plane.normal.clone().project(this.viewer.camera)
      ssNorm.setComponent(2, 0)
      ssNorm.normalize().multiplyScalar(-1)

      // mouse displacement
      let mD = this.pointer.clone().sub(new THREE.Vector3(e.x, e.y, 0.0))

      // quantity of mD on ssNorm
      let d = (ssNorm.dot(mD) / ssNorm.lengthSq())
      // configurable speed
      let zoom = this.viewer.camera.getWorldPosition(new THREE.Vector3()).sub(new THREE.Vector3()).length()
      zoom *= 0.75
      let displacement = new THREE.Vector3(d,d,d).multiply(plane.normal).multiplyScalar(zoom)
      plane.translate(displacement)

      this.boxMesh.geometry.vertices.map((v,i) => {
        if(!planeObj.indices.includes(i)) return
        this.boxMesh.geometry.vertices[i].add(displacement)
      })

      this.boxMesh.geometry.verticesNeedUpdate = true
      this.boxMesh.geometry.computeBoundingBox();
      this.boxMesh.geometry.computeBoundingSphere();
      
      this.pointer = new THREE.Vector3(e.x, e.y, 0.0)
      
      this.updateEdges()
      
      this.updateHover(planeObj)
    })
  }

  setFromBbox(bbox){
    console.log(bbox)
  }

  updateEdges(){
    this.displayEdges.clear()
    edges.map(val => {
      let pts = [this.boxMesh.geometry.vertices[val[0]].clone(),
                 this.boxMesh.geometry.vertices[val[1]].clone()]
      this.drawLine(pts)
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

    switch(planeObj.axis){
      case '+x':
        hoverGeo.rotateY(Math.PI / 2)
        hoverGeo.rotateX(Math.PI / 2)
        break
      case '-x':
        hoverGeo.rotateY(-Math.PI / 2)
        hoverGeo.rotateX(-Math.PI / 2)
        break
      case '+y':
        hoverGeo.rotateX(- Math.PI / 2)
        break
      case '-y':
        hoverGeo.rotateX(Math.PI / 2)
        break
      default:
        break
    }

    hoverGeo.translate(centroid.x, centroid.y, centroid.z)

    let hoverMesh = new THREE.Mesh(hoverGeo, this.hoverMat)
    this.displayHover.add(hoverMesh)
  }

  // for caps
  // https://github.com/mrdoob/three.js/blob/master/examples/webgl_clipping_stencil.html
}