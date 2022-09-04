import {
  AlwaysStencilFunc,
  BackSide,
  Color,
  FrontSide,
  Group,
  KeepStencilOp,
  LessStencilFunc,
  Material,
  Mesh,
  MeshBasicMaterial,
  Plane,
  PlaneGeometry,
  RepeatWrapping,
  ReplaceStencilOp,
  Vector3
} from 'three'
import { Assets } from '../Assets'
import SectionBox from '../SectionBox'
import pocheTex from '../../assets/poche2.png'

export class PocheSectionsPass {
  private _clippingPlanes: Plane[] = null
  public _stencilGroup: Group = null
  private _stencilPlane: Mesh = null

  constructor(clippingPlanes: Plane[]) {
    this._clippingPlanes = clippingPlanes
  }

  public update(sectionBox: SectionBox) {
    if (!this._stencilPlane) return
    // const position = new Vector3().copy(plane.normal).multiplyScalar(plane.constant)
    // const quaternion = new Quaternion().setFromUnitVectors(
    //   new Vector3(0, 1, 0),
    //   plane.normal
    // )
    // console.log(position)
    // this._stencilPlane.position.copy(position)
    // this._stencilPlane.quaternion.copy(quaternion)
    // this._stencilPlane.matrixWorldNeedsUpdate = true
    const sBox = sectionBox.getCurrentBox()
    if (sBox) {
      const center = sBox.getCenter(new Vector3())
      const size = sBox.getSize(new Vector3())
      this._stencilPlane.position.copy(center.add(new Vector3(0, 0, size.z * 0.5)))
    }
    const pln = new Plane().copy(sectionBox.planes[0])
    pln.setFromNormalAndCoplanarPoint(
      sectionBox.planes[0].normal,
      new Vector3()
        .copy(this._stencilPlane.position)
        .add(new Vector3().copy(sectionBox.planes[0].normal).multiplyScalar(-5))
    )
    this._stencilGroup.traverse((obj) => {
      if (!(obj instanceof Mesh)) return
      const mesh: Mesh = obj as Mesh
      ;(mesh.material as Material).clippingPlanes = sectionBox.planes //[(pln, sectionBox.planes[2])]
    })
    // ;(this._stencilPlane.material as Material).clippingPlanes = [pln]
  }

  public buildStencilGoup(sceneGeometry: Mesh[]) {
    this._stencilGroup = new Group()
    this._stencilGroup.name = 'StencilGroup'

    const baseMat = new MeshBasicMaterial()
    // baseMat.depthWrite = false
    // baseMat.depthTest = false
    baseMat.colorWrite = false
    baseMat.stencilWrite = true
    baseMat.stencilFunc = AlwaysStencilFunc

    for (let k = 0; k < sceneGeometry.length; k++) {
      // back faces
      const mat0 = baseMat.clone()
      mat0.side = BackSide
      mat0.color = new Color(1, 0, 0)
      mat0.clippingPlanes = this._clippingPlanes
      mat0.stencilRef = 1
      mat0.stencilFail = KeepStencilOp
      mat0.stencilZFail = KeepStencilOp
      mat0.stencilZPass = ReplaceStencilOp
      const mesh0 = new Mesh(sceneGeometry[k].geometry, mat0)
      mesh0.scale.copy(sceneGeometry[k].scale)
      mesh0.renderOrder = 0
      this._stencilGroup.add(mesh0)
      // //@ts-ignore
      // mesh0.onBeforeRender = (renderer) => {
      //   //@ts-ignore
      //   const gl = renderer.getContext()
      //   gl.enable(gl.CULL_FACE)
      //   gl.cullFace(gl.FRONT)
      // }

      // front faces
      const mat1 = baseMat.clone()
      mat1.side = FrontSide
      mat1.color = new Color(0, 1, 0)
      mat1.clippingPlanes = this._clippingPlanes
      mat1.stencilRef = 0
      mat1.stencilFail = KeepStencilOp
      mat1.stencilZFail = KeepStencilOp
      mat1.stencilZPass = ReplaceStencilOp
      mat1.polygonOffset = true
      mat1.polygonOffsetFactor = 0.01
      mat1.polygonOffsetUnits = 1
      const mesh1 = new Mesh(sceneGeometry[k].geometry, mat1)
      mesh1.scale.copy(sceneGeometry[k].scale)
      mesh1.renderOrder = 0
      this._stencilGroup.add(mesh1)
      // //@ts-ignore
      // mesh1.onBeforeRender = (renderer) => {
      //   //@ts-ignore
      //   const gl = renderer.getContext()
      //   gl.enable(gl.CULL_FACE)
      //   gl.cullFace(gl.BACK)
      // }
    }

    return this._stencilGroup
  }

  public async buildPlaneStencil() {
    // plane is clipped by the other clipping planes
    const tex = await Assets.getTexture(pocheTex)
    tex.wrapT = RepeatWrapping
    tex.wrapS = RepeatWrapping
    tex.repeat.set(10000, 10000)
    const planeMat = new MeshBasicMaterial({
      color: 0x047efb,
      map: tex,
      //   metalness: 0.1,
      //   roughness: 0.75,
      //   clippingPlanes: planes.filter((p) => p !== plane),

      stencilWrite: true,
      stencilRef: 0,
      stencilFunc: LessStencilFunc,
      stencilFail: ReplaceStencilOp,
      stencilZFail: ReplaceStencilOp,
      stencilZPass: ReplaceStencilOp
    })
    this._stencilPlane = new Mesh(new PlaneGeometry(10000, 10000), planeMat)
    this._stencilPlane.name = 'ClipPlane'
    this._stencilPlane.onBeforeRender = function (renderer) {
      renderer.clearDepth()
    }
    this._stencilPlane.onAfterRender = function (renderer) {
      renderer.getContext().clearStencil(0)
    }

    this._stencilPlane.renderOrder = 2
    // this._stencilGroup.add(this._stencilPlane)
    return this._stencilPlane
  }
}
