import {
  AmbientLight,
  Group,
  HemisphereLight,
  LinearToneMapping,
  PointLight,
  Scene,
  sRGBEncoding,
  Texture,
  WebGLRenderer
} from 'three'
import { GeometryType } from './batching/Batch'
import Batcher from './batching/Batcher'
import { SpeckleType } from './converter/GeometryConverter'
import { Intersections } from './Intersections'

export default class SceneManager {
  private _renderer: WebGLRenderer
  public scene: Scene
  private batcher: Batcher
  private intersections: Intersections

  public get renderer(): WebGLRenderer {
    return this._renderer
  }

  public set indirectIBL(texture: Texture) {
    this.scene.environment = texture
  }

  public constructor() {
    this.scene = new Scene()
    this.batcher = new Batcher()
    this.intersections = new Intersections(this.scene, this.batcher)
    this.intersections
  }

  public create(container: HTMLElement) {
    this._renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    })
    this._renderer.setClearColor(0xcccccc, 0)
    this._renderer.setPixelRatio(window.devicePixelRatio)
    this._renderer.outputEncoding = sRGBEncoding
    this._renderer.toneMapping = LinearToneMapping
    this._renderer.toneMappingExposure = 0.5
    this._renderer.setSize(container.offsetWidth, container.offsetHeight)
    container.appendChild(this._renderer.domElement)

    this.addDirectLights()
  }

  public addRenderTree() {
    this.batcher.makeBatches(GeometryType.MESH, SpeckleType.Mesh, SpeckleType.Brep)
    this.batcher.makeBatches(
      GeometryType.LINE,
      SpeckleType.Line,
      SpeckleType.Curve,
      SpeckleType.Polycurve,
      SpeckleType.Polyline,
      SpeckleType.Arc,
      SpeckleType.Circle,
      SpeckleType.Ellipse
    )
    this.batcher.makeBatches(GeometryType.POINT, SpeckleType.Point)
    this.batcher.makeBatches(GeometryType.POINT, SpeckleType.Pointcloud)

    const contentGroup = new Group()
    contentGroup.name = 'ContentGroup'
    this.scene.add(contentGroup)

    for (const k in this.batcher.batches) {
      contentGroup.add(this.batcher.batches[k].renderObject)
    }
  }

  private addDirectLights() {
    const ambientLight = new AmbientLight(0xffffff)
    this.scene.add(ambientLight)

    const lights = []
    lights[0] = new PointLight(0xffffff, 0.21, 0)
    lights[1] = new PointLight(0xffffff, 0.21, 0)
    lights[2] = new PointLight(0xffffff, 0.21, 0)
    lights[3] = new PointLight(0xffffff, 0.21, 0)

    const factor = 1000
    lights[0].position.set(1 * factor, 1 * factor, 1 * factor)
    lights[1].position.set(1 * factor, -1 * factor, 1 * factor)
    lights[2].position.set(-1 * factor, -1 * factor, 1 * factor)
    lights[3].position.set(-1 * factor, 1 * factor, 1 * factor)

    this.scene.add(lights[0])
    this.scene.add(lights[1])
    this.scene.add(lights[2])
    this.scene.add(lights[3])

    const hemiLight = new HemisphereLight(0xffffff, 0x0, 0.2)
    hemiLight.color.setHSL(1, 1, 1)
    hemiLight.groundColor.setHSL(0.095, 1, 0.75)
    hemiLight.up.set(0, 0, 1)
    this.scene.add(hemiLight)
  }
}
