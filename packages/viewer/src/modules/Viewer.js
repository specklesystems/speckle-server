import * as THREE from 'three'

import CameraControls from 'camera-controls'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'

import ObjectManager from './SceneObjectManager'
import ViewerObjectLoader from './ViewerObjectLoader'
import EventEmitter from './EventEmitter'
import InteractionHandler from './InteractionHandler'

export default class Viewer extends EventEmitter {

  constructor( { container, postprocessing = true, reflections = true, showStats = false } ) {
    super()

    this.clock = new THREE.Clock()

    this.container = container || document.getElementById( 'renderer' )
    this.postprocessing = postprocessing
    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight )
    this.camera.up.set( 0, 0, 1 )
    this.camera.position.set( 1, 1, 1 )
    this.camera.updateProjectionMatrix()

    this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true, preserveDrawingBuffer: true } )
    this.renderer.setClearColor( 0xcccccc, 0 )
    this.renderer.setPixelRatio( window.devicePixelRatio )
    this.renderer.setSize( this.container.offsetWidth, this.container.offsetHeight )
    this.container.appendChild( this.renderer.domElement )

    // commented out because the ssao flash is annoying
    // this.renderer.gammaFactor = 2.2
    // this.renderer.outputEncoding = THREE.sRGBEncoding

    this.reflections = reflections
    this.reflectionsNeedUpdate = true
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 512, { format: THREE.RGBFormat, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter } )
    this.cubeCamera = new THREE.CubeCamera( 0.1, 10_000, cubeRenderTarget )
    this.scene.add( this.cubeCamera )

    CameraControls.install( { THREE: THREE } )
    this.controls = new CameraControls( this.camera, this.renderer.domElement )
    this.controls.maxPolarAngle = Math.PI / 2

    this.composer = new EffectComposer( this.renderer )

    this.ssaoPass = new SSAOPass( this.scene, this.camera, this.container.offsetWidth, this.container.offsetHeight )
    this.ssaoPass.kernelRadius = 0.03
    this.ssaoPass.kernelSize = 16
    this.ssaoPass.minDistance = 0.0002
    this.ssaoPass.maxDistance = 10
    this.ssaoPass.output = SSAOPass.OUTPUT.Default
    this.composer.addPass( this.ssaoPass )

    this.pauseSSAO = false
    this.controls.addEventListener( 'wake', () => { this.pauseSSAO = true } )
    this.controls.addEventListener( 'sleep', () => { this.pauseSSAO = false; this.needsRender = true } )

    // Keeps track of loaded objects
    this.sceneManager = new ObjectManager( this )

    if ( showStats ) {
      this.stats = new Stats()
      this.container.appendChild( this.stats.dom )
    }

    window.addEventListener( 'resize', this.onWindowResize.bind( this ), false )

    this.interactions = new InteractionHandler( this )

    this.needsRender = true
    this.sceneLights()
    this.animate()

    this.loaders = []
  }

  sceneLights() {
    let ambientLight = new THREE.AmbientLight( 0xffffff )
    this.scene.add( ambientLight )

    const lights = []
    lights[ 0 ] = new THREE.PointLight( 0xffffff, 0.21, 0 )
    lights[ 1 ] = new THREE.PointLight( 0xffffff, 0.21, 0 )
    lights[ 2 ] = new THREE.PointLight( 0xffffff, 0.21, 0 )
    lights[ 3 ] = new THREE.PointLight( 0xffffff, 0.21, 0 )

    let factor = 1000
    lights[ 0 ].position.set( 1 * factor, 1 * factor, 1 * factor )
    lights[ 1 ].position.set( 1 * factor, -1 * factor, 1 * factor )
    lights[ 2 ].position.set( -1 * factor, -1 * factor, 1 * factor )
    lights[ 3 ].position.set( -1 * factor, 1 * factor, 1 * factor )

    this.scene.add( lights[ 0 ] )
    this.scene.add( lights[ 1 ] )
    this.scene.add( lights[ 2 ] )
    this.scene.add( lights[ 3 ] )

    // let sphereSize = 0.2
    // this.scene.add( new THREE.PointLightHelper( lights[ 0 ], sphereSize ) )
    // this.scene.add( new THREE.PointLightHelper( lights[ 1 ], sphereSize ) )
    // this.scene.add( new THREE.PointLightHelper( lights[ 2 ], sphereSize ) )
    // this.scene.add( new THREE.PointLightHelper( lights[ 3 ], sphereSize ) )


    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x0, 0.2 )
    hemiLight.color.setHSL( 1, 1, 1 )
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 )
    hemiLight.up.set( 0, 0, 1 )
    this.scene.add( hemiLight )

    let axesHelper = new THREE.AxesHelper( 1 )
    this.scene.add( axesHelper )

    let group = new THREE.Group()
    this.scene.add( group )
  }

  onWindowResize() {
    this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize( this.container.offsetWidth, this.container.offsetHeight )
    this.composer.setSize( this.container.offsetWidth, this.container.offsetHeight )
  }

  animate() {
    // requestAnimationFrame( this.animate.bind( this ) )
    // this.controls.update()
    //
    const delta = this.clock.getDelta()
    const hasControlsUpdated = this.controls.update( delta )

    requestAnimationFrame( this.animate.bind( this ) )

    // you can skip this condition to render though
    if ( hasControlsUpdated || this.needsRender ) {
      this.needsRender = false
      if ( this.stats ) this.stats.begin()
      this.render()
      if ( this.stats ) this.stats.end()
    }

  }

  render() {
    if ( this.reflections && this.reflectionsNeedUpdate ) {
      // Note: scene based "dynamic" reflections need to be handled a bit more carefully, or else:
      // GL ERROR :GL_INVALID_OPERATION : glDrawElements: Source and destination textures of the draw are the same.
      // First remove the env map from all materials
      for ( let obj of this.sceneManager.objects ) {
        obj.material.envMap = null
      }

      // Second, set a scene background color (renderer is transparent by default)
      // and then finally update the cubemap camera.
      this.scene.background = new THREE.Color( '#F0F3F8' )
      this.cubeCamera.update( this.renderer, this.scene )
      this.scene.background = null

      // Finally, re-set the env maps of all materials
      for ( let obj of this.sceneManager.objects ) {
        obj.material.envMap = this.cubeCamera.renderTarget.texture
      }
      this.reflectionsNeedUpdate = false
    }

    // Render as usual
    // TODO: post processing SSAO sucks so much currently it's off by default
    // if ( this.postprocessing && !this.pauseSSAO && !this.renderer.localClippingEnabled ){
    if ( this.postprocessing && !this.pauseSSAO ) {
      // console.log('composer')
      this.composer.render( this.scene, this.camera )
    }
    else {
      // console.log('renderer')
      this.renderer.render( this.scene, this.camera )
    }
  }

  async loadObject( url, token ) {
    let loader = new ViewerObjectLoader( this, url, token )
    this.loaders.push( loader )
    await loader.load()
  }

  dispose() {
    // TODO
  }l
}
