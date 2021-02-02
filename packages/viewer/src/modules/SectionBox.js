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

const verts = {

}

export default class SectionBox {
  constructor(viewer){
    this.viewer = viewer

    // basic display of the section box
    this.boxMaterial = new THREE.MeshBasicMaterial({
                                      transparent:true,
                                      color: 0xffe842, 
                                      opacity: 0.25
                                    })

    // the box itself, this might not be displayed as a mesh
    this.box = new THREE.BoxGeometry(2,2,2)
    this.mesh = new THREE.Mesh(this.box, this.boxMaterial)    
    this.display = new THREE.Group()
    this.display.add(this.mesh)
    
    this.hover = new THREE.Group() // meshes to indicate hover
    this.hoverPlane = new THREE.Vector3() // normal of plane being hovered
    this.display.add(this.hover)
    
    this.viewer.scene.add(this.display)

    this.selectionHelper = new SelectionHelper( this.viewer, {subset:[this.mesh], hover:true} )
    this.mouseDown = new THREE.Vector3() // mouseDown on begin drag

    this.planes = [
      new THREE.Plane( new THREE.Vector3( - 1, 0, 0 ), 1 ), // left
      new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), 1 ), // in
      new THREE.Plane( new THREE.Vector3( 0, 0, - 1 ), 1 ), // down
      new THREE.Plane( new THREE.Vector3( 1, 0, 0 ), 1 ),   // right
      new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), 1 ),   // out
      new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), 1 )    // up
    ];

    // helpers for projection stuff
    this.elem1 = document.createElement('div');
    document.querySelector('#renderer').append(this.elem1);
    this.elem1.style.backgroundColor = 'red'
    this.elem1.style.width = '25px'
    this.elem1.style.height = '25px'
    this.elem1.style.borderRadius = '15px'
    this.elem1.style.position = 'absolute'

    this.elem2 = document.createElement('div');
    document.querySelector('#renderer').append(this.elem2);
    this.elem2.style.backgroundColor = 'blue'
    this.elem2.style.width = '25px'
    this.elem2.style.height = '25px'
    this.elem2.style.borderRadius = '15px'
    this.elem2.style.position = 'absolute'

    // this.planeHelpers = this.planes.map( p => new THREE.PlaneHelper( p, 2, 0x000000 ) );
    // this.planeHelpers.forEach( ph => {
    //   // ph.visible = false;
    //   this.display.add( ph );
    // } );

    // this.viewer.renderer.localClippingEnabled = true;

    let planeGeometry = new THREE.PlaneGeometry(4, 4)

    for(let i = 0; i < this.planes; i++){
      let plane = this.planes[i]
      
      // this.stencilGroup = createPlaneStencilGroup( this.viewer.sceneManager.objects , plane, i + 1 );

      let planeMat = new THREE.MeshStandardMaterial( {

            color: 0xE91E63,
            metalness: 0.1,
            roughness: 0.75,
            clippingPlanes: planes.filter( p => p !== plane ),

            stencilWrite: true,
            stencilRef: 0,
            stencilFunc: THREE.NotEqualStencilFunc,
            stencilFail: THREE.ReplaceStencilOp,
            stencilZFail: THREE.ReplaceStencilOp,
            stencilZPass: THREE.ReplaceStencilOp,

          } );
      
      let planeObject = new THREE.Mesh( planeGeometry, planeMat);
      this.display.add(planeObject)
      // planeObject.onAfterRender = function ( renderer ) {
      //   renderer.clearStencil()
      // }
      
      // planeObject.renderOrder = i + 1.1;
      // object.add( stencilGroup );
      // poGroup.add( po );
      // planeObjects.push( po );
      // scene.add( poGroup );
    }

    this.hoverMat = new THREE.MeshStandardMaterial( {
      color: 0xE91E63,
      metalness: 0.1,
      roughness: 0.75,
    } ); 

    this.selectionHelper.on('hovered', (obj, e) => {

      if(obj.length === 0) {
        this.hover.clear()
        this.hoverPlane = new THREE.Vector3()
        this.viewer.controls.enabled = true
        this.viewer.renderer.domElement.style.cursor = 'default'
        return;
      }

      let index = this.planes.findIndex(p => p.normal.equals(obj[0].face.normal))
      if(index < 0) return // this should never be the case?
      let plane = this.planes[index]
      
      if(plane.normal.equals(this.hoverPlane)) return
      this.hoverPlane = plane.normal.clone()

      this.hover.clear()

      let n = plane.normal.clone()
      let c = plane.constant
      
      // TODO: set plane geometry size by box size
      let hoverGeo = new THREE.PlaneGeometry(2,2)
      hoverGeo.lookAt(n)

      // add 0.01 to eliminate z fighting
      hoverGeo.translate(n.x * (c + 0.01), n.y * (c + 0.01), n.z * (c + 0.01))
      let hoverMesh = new THREE.Mesh(hoverGeo, this.hoverMat)
      
      this.hover.add(hoverMesh)
      this.viewer.renderer.domElement.style.cursor = 'pointer';

      this.mouseDown = new THREE.Vector3(e.x, e.y, e.y);
    })

    this.selectionHelper.on('object-clicked', (e) => {
      console.log('clicked!')
      console.log(e)
    })

    this.selectionHelper.on('object-drag', (obj, e) => {
      if(this.selectionHelper.orbiting === true) return
      this.viewer.controls.enabled = false

      this.viewer.renderer.domElement.style.cursor = 'move';

      let index = this.planes.findIndex(p => p.normal.equals(obj[0].face.normal))
      let plane = this.planes[index]
      let tempV1 = plane.normal.clone().multiplyScalar(plane.constant)
      
      let tempV2 = tempV1.clone().multiplyScalar(2)

      if(this.hover.children.length < 1) return

      tempV1.project(this.viewer.camera)
      tempV2.project(this.viewer.camera)

      let x = (tempV1.x * .5 + 0.5) * this.viewer.renderer.domElement.clientWidth
      let y = (tempV1.y * .5 + 0.5) * this.viewer.renderer.domElement.clientHeight * -1
      console.log("x: ", x, "y: ", y)
      this.elem1.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px)`

      x = (tempV2.x * .5 + 0.5) * this.viewer.renderer.domElement.clientWidth
      y = (tempV2.y * .5 + 0.5) * this.viewer.renderer.domElement.clientHeight * -1
      console.log("x: ", x, "y: ", y)
      this.elem2.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px)`

      // this looks promising - will have to figure out how to move stuff next
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