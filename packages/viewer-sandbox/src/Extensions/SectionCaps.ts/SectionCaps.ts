import {
  DefaultPipeline,
  Extension,
  IViewer,
  ObjectLayers,
  SectionTool,
  SectionToolEvent
} from '@speckle/viewer'
import {
  FrontSide,
  KeepStencilOp,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  NotEqualStencilFunc,
  Plane,
  PlaneGeometry,
  Quaternion,
  Vector3
} from 'three'
import { SectionCapsPipeline } from './SectionCapsPipeline'

export class SectionCaps extends Extension {
  protected planeMesh: Mesh
  protected _enabled = false

  public get enabled(): boolean {
    return this._enabled
  }
  public set enabled(value: boolean) {
    this._enabled = value
    if (value) {
      this.viewer.getRenderer().pipeline = new SectionCapsPipeline(
        this.viewer.getRenderer()
      )
    } else {
      this.viewer.getRenderer().pipeline = new DefaultPipeline(
        this.viewer.getRenderer()
      )
    }
  }

  public get inject() {
    return [SectionTool]
  }

  constructor(viewer: IViewer, protected sectionTool: SectionTool) {
    super(viewer)

    this.planeMesh = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({
        color: 0x047efb,
        side: FrontSide,
        stencilWrite: true,
        stencilFunc: NotEqualStencilFunc,
        stencilFail: KeepStencilOp,
        stencilZFail: KeepStencilOp,
        stencilZPass: KeepStencilOp
      })
    )
    this.planeMesh.renderOrder = 5
    this.planeMesh.layers.set(ObjectLayers.OVERLAY)
    viewer.getRenderer().scene.add(this.planeMesh)

    this.sectionTool.on(SectionToolEvent.Updated, (planes: Plane[]) => {
      const obb = this.sectionTool.getBox()
      this.planeMesh.matrixAutoUpdate = false
      this.planeMesh.matrix.copy(
        this.getPlaneTransform(
          // Top facing plane
          planes[5],
          new Vector3(2 * obb.halfSize.x, 2 * obb.halfSize.y, 1)
        )
      )
    })
  }

  protected getPlaneTransform(plane: Plane, scale: Vector3) {
    const obb = this.sectionTool.getBox()
    const n = plane.normal.clone().normalize().negate()

    const up = Math.abs(n.z) < 0.999 ? new Vector3(0, 0, 1) : new Vector3(0, 1, 0)
    const t1 = new Vector3().crossVectors(up, n).normalize()
    const t2 = new Vector3().crossVectors(n, t1).normalize()

    const basis = new Matrix4().makeBasis(t1, t2, n)
    const q = new Quaternion().setFromRotationMatrix(basis)
    const p = plane.projectPoint(obb.center.clone(), new Vector3())

    const worldTRS = new Matrix4().compose(p, q, scale)

    return worldTRS
  }
}
