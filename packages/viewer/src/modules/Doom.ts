import {
  BoxGeometry,
  Camera,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene
} from 'three'
import SpeckleRenderer from './SpeckleRenderer'
import { World } from './World'

export class Doom {
  private doomScene: Scene
  private camera: Camera

  public constructor(renderer: SpeckleRenderer, camera: Camera) {
    this.doomScene = renderer.getDoomScene()
    this.camera = camera
  }

  public init() {
    World.createCannonWorld()
    // const planeGeometry = new PlaneGeometry(250, 250)
    // const planeMesh = new Mesh(planeGeometry, new MeshStandardMaterial())
    // planeMesh.position.z = -0.5
    // planeMesh.receiveShadow = true
    // this.doomScene.add(planeMesh)
    // World.addPlaneCannonPrimitive(planeMesh)

    // const cube = new BoxGeometry(2, 2, 2)
    // const cubeMesh = new Mesh(cube, new MeshStandardMaterial())
    // cubeMesh.receiveShadow = true
    // this.doomScene.add(cubeMesh)
    // World.addBoxCannonPrimitive(cubeMesh)

    World.addCameraSphere()
  }

  public update() {
    this.camera.position.copy(World.getCameraPosition())
    ;(this.camera as PerspectiveCamera).near = 0.001
  }
}
