import {
  AmbientLight,
  Box3,
  Group,
  HemisphereLight,
  Intersection,
  LinearToneMapping,
  PointLight,
  Scene,
  Sphere,
  sRGBEncoding,
  Texture,
  Vector3,
  WebGLRenderer
} from 'three'
import { GeometryType } from './batching/Batch'
import Batcher from './batching/Batcher'
import { SpeckleType } from './converter/GeometryConverter'
import Input, { InputOptionsDefault } from './input/Input'
import { Intersections } from './Intersections'
import { WorldTree } from './tree/WorldTree'
import { Viewer } from './Viewer'

export default class SceneManager {
  private _renderer: WebGLRenderer
  public scene: Scene
  private batcher: Batcher
  private intersections: Intersections
  private input: Input
  public viewer: Viewer // TEMPORARY

  public get renderer(): WebGLRenderer {
    return this._renderer
  }

  public set indirectIBL(texture: Texture) {
    this.scene.environment = texture
  }

  public constructor(viewer: Viewer /** TEMPORARY */) {
    this.scene = new Scene()
    this.batcher = new Batcher()
    this.intersections = new Intersections()
    this.viewer = viewer
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

    this.input = new Input(this._renderer.domElement, InputOptionsDefault)
    this.input.on('object-clicked', this.onObjectClick.bind(this))
    this.input.on('object-doubleclicked', this.onObjectDoubleClick.bind(this))

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

  private onObjectClick(e) {
    const result: Intersection = this.intersections.intersect(
      this.scene,
      this.viewer.cameraHandler.activeCam.camera,
      e
    )
    if (!result) {
      this.batcher.resetBatchesDrawRanges()
      return
    }

    // console.warn(result)
    const rv = this.batcher.getRenderView(
      result.object.uuid,
      result.faceIndex !== undefined ? result.faceIndex : result.index
    )
    const hitId = rv.renderData.id

    const hitNode = WorldTree.getInstance().findId(hitId)
    // console.warn(hitNode)
    const renderViews = WorldTree.getRenderTree().getRenderViewsForNode(hitNode)
    // console.warn(renderViews)
    this.batcher.selectRenderViews(renderViews)
    // this.batcher.selectRenderView(rv)
    // this.batcher.isolateRenderViews(renderViews)
  }

  private onObjectDoubleClick(e) {
    const result: Intersection = this.intersections.intersect(
      this.scene,
      this.viewer.cameraHandler.activeCam.camera,
      e
    )
    let rv = null
    if (!result) {
      if (this.viewer.sectionBox.display.visible) {
        this.zoomToBox(this.viewer.sectionBox.cube, 1.2, true)
      } else {
        this.zoomExtents()
      }
    } else {
      rv = this.batcher.getRenderView(
        result.object.uuid,
        result.faceIndex !== undefined ? result.faceIndex : result.index
      )
      this.zoomToBox(rv.aabb, 1.2, true)
    }

    this.viewer.needsRender = true
    this.viewer.emit(
      'object-doubleclicked',
      result ? rv.renderData.id : null,
      result ? result.point : null
    )
  }

  /** Taken from InteractionsHandler. Will revisit in the future */
  zoomExtents(fit = 1.2, transition = true) {
    if (this.viewer.sectionBox.display.visible) {
      this.zoomToBox(this.viewer.sectionBox.cube, 1.2, true)
      return
    }
    if (this.scene.getObjectByName('ContentGroup').children.length === 0) {
      const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
      this.zoomToBox(box, fit, transition)
      return
    }

    const box = new Box3().setFromObject(this.scene.getObjectByName('ContentGroup'))
    this.zoomToBox(box, fit, transition)
    // this.viewer.controls.setBoundary( box )
  }

  /** Taken from InteractionsHandler. Will revisit in the future */
  zoomToBox(box, fit = 1.2, transition = true) {
    if (box.max.x === Infinity || box.max.x === -Infinity) {
      box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
    }
    const fitOffset = fit

    const size = box.getSize(new Vector3())
    const target = new Sphere()
    box.getBoundingSphere(target)
    target.radius = target.radius * fitOffset

    const maxSize = Math.max(size.x, size.y, size.z)
    const camFov = this.viewer.cameraHandler.camera.fov
      ? this.viewer.cameraHandler.camera.fov
      : 55
    const camAspect = this.viewer.cameraHandler.camera.aspect
      ? this.viewer.cameraHandler.camera.aspect
      : 1.2
    const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * camFov) / 360))
    const fitWidthDistance = fitHeightDistance / camAspect
    const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance)

    this.viewer.cameraHandler.controls.fitToSphere(target, transition)

    this.viewer.cameraHandler.controls.minDistance = distance / 100
    this.viewer.cameraHandler.controls.maxDistance = distance * 100
    this.viewer.cameraHandler.camera.near = distance / 100
    this.viewer.cameraHandler.camera.far = distance * 100
    this.viewer.cameraHandler.camera.updateProjectionMatrix()

    if (this.viewer.cameraHandler.activeCam.name === 'ortho') {
      this.viewer.cameraHandler.orthoCamera.far = distance * 100
      this.viewer.cameraHandler.orthoCamera.updateProjectionMatrix()

      // fit the camera inside, so we don't have clipping plane issues.
      // WIP implementation
      const camPos = this.viewer.cameraHandler.orthoCamera.position
      let dist = target.distanceToPoint(camPos)
      if (dist < 0) {
        dist *= -1
        this.viewer.cameraHandler.controls.setPosition(
          camPos.x + dist,
          camPos.y + dist,
          camPos.z + dist
        )
      }
    }
  }
}
