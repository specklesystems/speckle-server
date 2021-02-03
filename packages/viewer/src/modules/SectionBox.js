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
                                      transparent:true,
                                      color: 0xffe842, 
                                      opacity: 0.25
                                    })
                  
    // the box itself, this might not be displayed as a mesh
    this.boxGeo = new THREE.BoxGeometry(2,2,2)
    this.boxMesh = new THREE.Mesh(this.boxGeo, this.boxMaterial)    
    this.boxMesh.name = 'section-box'
    this.displayBox.add(this.boxMesh)
    
    this.lineMaterial = new THREE.LineDashedMaterial({
      color: 0x000000,
      linewidth: 4,
    })

    // going to have to do an update edges thing at some point
    edges.map(val => {
      let pts = [this.boxGeo.vertices[val[0]].clone(),
                 this.boxGeo.vertices[val[1]].clone()]
      let geo = new THREE.BufferGeometry().setFromPoints(pts)
      let line = new THREE.Line(geo, this.lineMaterial)
      this.displayEdges.add(line)
    })
    
    this.hoverPlane = new THREE.Vector3() // normal of plane being hovered

    this.selectionHelper = new SelectionHelper( this.viewer, {subset:'section-box', hover:true} )

    this.mouseDown = new THREE.Vector3() // mouseDown on begin drag
    this.dragging = false
    
    this.planes = [{
        // left, x negative
        plane: new THREE.Plane( new THREE.Vector3( - 1, 0, 0 ), -1 ),
        indices: [5,4,6,7],
      },{
        // in, y negative
        plane:new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), -1 ),
        indices: [2,3,6,7],
      },{
        // down, z negative
        plane:new THREE.Plane( new THREE.Vector3( 0, 0, - 1 ), -1 ),
        indices: [1,3,6,4],
      },{
        // right, x positive
        plane:new THREE.Plane( new THREE.Vector3( 1, 0, 0 ), -1 ),
        indices: [0,1,3,2],
      },{
        // out, y positive
        plane:new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), -1 ),   
        indices: [5,4,1,0],
      },{
        // up, z positive
        plane:new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), -1 ),
        indices: [0,2,7,5],
      }];

    // helpers for projection stuff
    this.elem1 = document.createElement('div');
    document.querySelector('#renderer').append(this.elem1);
    this.elem1.style.backgroundColor = 'red'
    this.elem1.style.width = '10px'
    this.elem1.style.height = '10px'
    this.elem1.style.borderRadius = '5px'
    this.elem1.style.position = 'absolute'

    this.elem2 = document.createElement('div');
    document.querySelector('#renderer').append(this.elem2);
    this.elem2.style.backgroundColor = 'blue'
    this.elem2.style.width = '10px'
    this.elem2.style.height = '10px'
    this.elem2.style.borderRadius = '5px'
    this.elem2.style.position = 'absolute'

    // plane helpers
    this.planeHelpers = this.planes.map( p => this.display.add(new THREE.PlaneHelper( p.plane, 2, 0x000000 ) ));

    this.hoverMat = new THREE.MeshStandardMaterial( {
      color: 0xE91E63,
      metalness: 0.1,
      roughness: 0.75,
    } ); 

    this.selectionHelper.on('hovered', (obj, e) => {

      if(obj.length === 0 && !this.dragging) {
        this.displayHover.clear()
        this.hoverPlane = new THREE.Vector3()
        // need a this.dragging probably
        this.viewer.controls.enabled = true
        this.viewer.renderer.domElement.style.cursor = 'default'
        return;
      } else if (this.dragging){
        return
      }

      let index = this.planes.findIndex(p => p.plane.normal.equals(obj[0].face.normal))
      if(index < 0) return // this should never be the case?
      let plane = this.planes[index].plane
      
      if(plane.normal.equals(this.hoverPlane)) return
      this.hoverPlane = plane.normal.clone()
      
      this.displayHover.clear()

      let n = plane.normal.clone()
      let c = plane.constant * -1
      
      // TODO: set plane geometry size by box size
      let hoverGeo = new THREE.PlaneGeometry(2,2)
      hoverGeo.lookAt(n)

      // add 0.01 to eliminate z fighting
      hoverGeo.translate(n.x * (c + 0.01), n.y * (c + 0.01), n.z * (c + 0.01))
      let hoverMesh = new THREE.Mesh(hoverGeo, this.hoverMat)
      
      this.displayHover.add(hoverMesh)
      this.viewer.renderer.domElement.style.cursor = 'pointer';
    })

    // this.selectionHelper.on('object-clicked', (e) => {
    //   // console.log("object-clicked")

    // })

    this.viewer.renderer.domElement.addEventListener('pointerup', (e) => {
      this.mouseDown = new THREE.Vector3()
      this.viewer.controls.enabled = true
      this.dragging = false
    })

    this.selectionHelper.on('object-drag', (obj, e) => {
      // exit if we don't have a valide hoverPlane
      // this shouldn't be happening
      if(this.hoverPlane.equals(new THREE.Vector3())) return

      this.viewer.controls.enabled = false
      this.dragging = true
      
      if(this.mouseDown.equals(new THREE.Vector3())) this.mouseDown = new THREE.Vector3(e.x, e.y, 0.0)
      
      this.viewer.renderer.domElement.style.cursor = 'move';

      // get screen space vector of plane normal
      // project mouse displacement vector onto it
      // move plane by that much
      let index = this.planes.findIndex(p => p.plane.normal.equals(this.hoverPlane))
      let planeObj = this.planes[index]
      let plane = planeObj.plane
      
      // this should be a property of viewer
      let resolution = new THREE.Vector3(this.viewer.renderer.domElement.clientWidth, -1 * this.viewer.renderer.domElement.clientHeight, 0)
      
      // screen space normal vector
      let ssNorm = plane.normal.clone().multiplyScalar(plane.constant)
      ssNorm.project(this.viewer.camera)
      // convert to screen pixel coords
      ssNorm.multiplyScalar(0.5).addScalar(0.5).multiply(resolution)
      ssNorm.setComponent(2, 0.0).normalize()
      console.log(ssNorm)

      // mouse displacement
      let mD = this.mouseDown.clone().sub(new THREE.Vector3(e.x, e.y, 0.0))
      let mag = mD.length()
      mD.normalize()
      console.log(mD)

      // quantity of mD on ssNorm
      // need a persistent quantity for displacement so it doesn't keep accumulating
      let d = (ssNorm.dot(mD) / ssNorm.lengthSq())
      console.log(d)
      let displacement = new THREE.Vector3(d,d,d).multiply(plane.normal).multiplyScalar(mag)
      plane.translate(displacement)
      console.log(displacement)

      this.boxMesh.geometry.vertices.map((v,i) => {
        if(!planeObj.indices.includes(i)) return
        this.boxMesh.geometry.vertices[i].add(displacement)
      })
      this.boxMesh.geometry.verticesNeedUpdate = true

      //https://threejsfundamentals.org/threejs/lessons/threejs-align-html-elements-to-3d.html
      // let ssNormStart = plane.normal.clone().multiplyScalar(plane.constant)
      let ssNormEnd = plane.normal.clone().multiplyScalar(plane.constant * 2)
      // ssNormStart.project(this.viewer.camera)
      ssNormEnd.project(this.viewer.camera)

      // let x =  (ssNormStart.x * .5 + 0.5) * this.viewer.renderer.domElement.clientWidth
      // let y =  (ssNormStart.y * .5 + 0.5) * this.viewer.renderer.domElement.clientHeight
      // this.elem1.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px)`
      let x = (ssNormEnd.x * .5 + 0.5) * this.viewer.renderer.domElement.clientWidth
      let y = (ssNormEnd.y * .5 + 0.5) * this.viewer.renderer.domElement.clientHeight * -1
      this.elem2.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px)`
    })
  }

  // https://github.com/mrdoob/three.js/blob/master/examples/webgl_clipping_stencil.html
  // createPlaneStencilGroup( geometry, plane, renderOrder ) {
  //   const group = new THREE.Group()
  //   const baseMat = new THREE.MeshBasicMaterial()
  //   baseMat.depthWrite = false
  //   baseMat.depthTest = false
  //   baseMat.colorWrite = false
  //   baseMat.stencilWrite = true
  //   baseMat.stencilFunc = THREE.AlwaysStencilFunc

  //   // back faces
  //   const mat0 = baseMat.clone()
  //   mat0.side = THREE.BackSide
  //   mat0.clippingPlanes = [ plane ]
  //   mat0.stencilFail = THREE.IncrementWrapStencilOp
  //   mat0.stencilZFail = THREE.IncrementWrapStencilOp
  //   mat0.stencilZPass = THREE.IncrementWrapStencilOp

  //   const mesh0 = new THREE.Mesh( geometry, mat0 )
  //   mesh0.renderOrder = renderOrder
  //   group.add( mesh0 )

  //   // front faces
  //   const mat1 = baseMat.clone()
  //   mat1.side = THREE.FrontSide
  //   mat1.clippingPlanes = [ plane ]
  //   mat1.stencilFail = THREE.DecrementWrapStencilOp
  //   mat1.stencilZFail = THREE.DecrementWrapStencilOp
  //   mat1.stencilZPass = THREE.DecrementWrapStencilOp

  //   const mesh1 = new THREE.Mesh( geometry, mat1 )
  //   mesh1.renderOrder = renderOrder

  //   group.add( mesh1 )

  //   return group
  // }
}