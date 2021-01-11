import debounce from 'lodash.debounce'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'

import ObjectManager from './ObjectManager'

export default class Viewer {

  constructor( { container, postprocessing = true } ) {
    this.container = container || document.getElementById( 'renderer' )
    this.postprocessing = postprocessing
    this.scene = new THREE.Scene()

    this.sceneManager = new ObjectManager( this )

    this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight )
    this.camera.up.set( 0, 0, 1 )
    this.camera.position.set( 1, 1, 1 )

    this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } )
    this.renderer.setClearColor( 0xcccccc, 0 )
    this.renderer.setPixelRatio( window.devicePixelRatio )
    this.renderer.setSize( this.container.offsetWidth, this.container.offsetHeight )
    this.container.appendChild( this.renderer.domElement )

    this.controls = new OrbitControls( this.camera, this.renderer.domElement )
    this.controls.enableDamping = true // an animation loop is required when either damping or auto-rotation are enabled
    this.controls.dampingFactor = 0.05
    this.controls.screenSpacePanning = true
    this.controls.maxPolarAngle = Math.PI / 2

    this.isMovingCamera = false
    let test = debounce( () => {
      console.log( 'moving end' )
    }, 500 )

    this.controls.addEventListener( 'change', test )

    this.controls.addEventListener( 'start', () => {
      this.isMovingCamera = true
    } )
    this.controls.addEventListener( 'end', () => { console.log( 'end' ) /* TODO: debounce 100ms after changes end to "ready for selection/user interaction"*/ } )

    this.composer = new EffectComposer( this.renderer )

    this.ssaoPass = new SSAOPass( this.scene, this.camera, this.container.offsetWidth, this.container.offsetHeight )
    this.ssaoPass.kernelRadius = 3
    this.ssaoPass.minDistance = 0.0002
    this.ssaoPass.maxDistance = 0.2
    this.ssaoPass.output = SSAOPass.OUTPUT.Default
    this.composer.addPass( this.ssaoPass )

    this.stats = new Stats()
    this.container.appendChild( this.stats.dom )

    window.addEventListener( 'resize', this.onWindowResize.bind( this ), false )

    this.initScene()
    this.animate()
  }

  initScene() {
    let ambientLight = new THREE.AmbientLight( 0xffffff )
    this.scene.add( ambientLight )

    const lights = []
    lights[ 0 ] = new THREE.PointLight( 0xffffff, 0.31, 0 )
    lights[ 1 ] = new THREE.PointLight( 0xffffff, 0.31, 0 )
    lights[ 2 ] = new THREE.PointLight( 0xffffff, 0.31, 0 )

    lights[ 0 ].position.set( 0, 200, 0 )
    lights[ 1 ].position.set( 100, 200, 100 )
    lights[ 2 ].position.set( -100, -200, -100 )

    this.scene.add( lights[ 0 ] )
    this.scene.add( lights[ 1 ] )
    this.scene.add( lights[ 2 ] )

    // const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x0, 0.1 )
    // // hemiLight.color.setHSL( 0.6, 1, 0.6 )
    // // hemiLight.groundColor.setHSL( 0.095, 1, 0.75 )
    // hemiLight.up.set( 0, 0, 1 )
    // // hemiLight.position.set( 0, 50, 0 )
    // this.scene.add( hemiLight )

    let axesHelper = new THREE.AxesHelper( 1 )
    this.scene.add( axesHelper )

    let group = new THREE.Group()
    this.scene.add( group )

    const geometry = new THREE.BoxBufferGeometry( 10, 10, 10 )
    const material = new THREE.MeshLambertMaterial( {
      color: 0xD7D7D7,
      emissive: 0x0
    } )

    for ( let i = 0; i < 0; i++ ) {
      const mesh = new THREE.Mesh( geometry, material )
      mesh.position.x = Math.random() * 3
      mesh.position.y = Math.random() * 3
      mesh.position.z = Math.random() * 3
      mesh.rotation.x = Math.random()
      mesh.rotation.y = Math.random()
      mesh.rotation.z = Math.random()

      mesh.scale.setScalar( Math.random() * 0.1 )
      group.add( mesh )

    }
  }

  onWindowResize() {
    this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize( this.container.offsetWidth, this.container.offsetHeight )
    this.composer.setSize( this.container.offsetWidth, this.container.offsetHeight )
  }

  animate() {
    requestAnimationFrame( this.animate.bind( this ) )
    this.controls.update()
    this.stats.begin()
    this.render()
    this.stats.end()
  }

  render() {
    if ( this.postprocessing ){
      this.composer.render( this.scene, this.camera )
    }
    else {
      this.renderer.render( this.scene, this.camera )
    }
  }


}
