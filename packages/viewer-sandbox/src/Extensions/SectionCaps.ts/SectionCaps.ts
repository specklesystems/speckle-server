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
  LessStencilFunc,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Plane,
  PlaneGeometry,
  Quaternion,
  ReplaceStencilOp,
  Vector3
} from 'three'
import { SectionCapsPipeline } from './SectionCapsPipeline'

export class SectionCaps extends Extension {
  protected planeMeshes: Mesh[] = []
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

    for (let k = 0; k < 6; k++) {
      const planeMesh = new Mesh(
        new PlaneGeometry(1, 1),
        new MeshBasicMaterial({
          color: 0x047efb,
          side: FrontSide,
          // Original
          // stencilWrite: true,
          // stencilFunc: NotEqualStencilFunc,
          // stencilFail: KeepStencilOp,
          // stencilZFail: KeepStencilOp,
          // stencilZPass: KeepStencilOp

          // Ours
          stencilWrite: true,
          stencilRef: 0,
          stencilFunc: LessStencilFunc,
          stencilFail: ReplaceStencilOp,
          stencilZFail: ReplaceStencilOp,
          stencilZPass: ReplaceStencilOp
        })
      )
      planeMesh.renderOrder = 5
      planeMesh.matrixAutoUpdate = false
      planeMesh.layers.set(ObjectLayers.OVERLAY)
      viewer.getRenderer().scene.add(planeMesh)
      this.planeMeshes.push(planeMesh)
    }

    this.sectionTool.on(SectionToolEvent.Updated, (planes: Plane[]) => {
      const obb = this.sectionTool.getBox()
      for (let k = 0; k < planes.length; k++) {
        this.planeMeshes[k].matrix.copy(
          this.getPlaneTransform(
            // Top facing plane
            planes[k],
            new Vector3(2 * obb.halfSize.x, 2 * obb.halfSize.y, 1)
          )
        )
      }
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
