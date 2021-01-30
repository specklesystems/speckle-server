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
    this.viewer = viewer;

    // basic display of the section box
    this.boxMaterial = new THREE.MeshBasicMaterial({
                                      transparent:true,
                                      color: 0xffe842, 
                                      opacity: 0.25
                                    })

    this.box = new THREE.BoxGeometry(1,1,1)
    this.mesh = new THREE.Mesh(this.box, this.boxMaterial)    
    this.display = new THREE.Group();
    this.display.add(this.mesh);

    this.viewer.scene.add(this.display);

    this.selectionHelper = new SelectionHelper( this.viewer, {subset:[this.mesh], hover:true} );

    this.selectionHelper.on('hovered', (e) => {
      // console.log(e)
      console.log('hovered!')
      console.log(e[0].object.geometry.faces.filter(f => f.normal.equals(e[0].face.normal)))
    })

    this.selectionHelper.on('object-clicked', (e) => {
      console.log('clicked!')
      console.log(e);
    })

    // these edges are not ordered correctly                              
    // this.lineMaterial = new THREE.LineBasicMaterial({
    //                                                   color:0x000000,
    //                                                   lineWidth:5,
    //                                                 })
    // let edgeVerts = this.box.vertices.map((vec, i, arr) => 
    //                                       [vec.clone(), arr[(i + 1) % arr.length].clone()]);

    // this.lines = edgeVerts.map(pts => new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), this.lineMaterial));
    

  }
}

// ideally you would have a container that could hold many clipping planes
// so the box would just be a collection of those planes
// then the caps would be something that gets layered on probably at the Viewer level
