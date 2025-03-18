import { BufferGeometry, Camera, Object3D, Scene } from 'three'
import { SpeckleWebGLRenderer } from '../objects/SpeckleWebGLRenderer.js'
import { speckleDepthNormalIdFrag } from './shaders/speckle-depth-normal-id-frag.js'
import { speckleDepthNormalIdVert } from './shaders/speckle-depth-normal-id-vert.js'
import SpeckleDepthNormalMaterial from './SpeckleDepthNormalMaterial.js'
import SpeckleMesh from '../objects/SpeckleMesh.js'
import { Uniforms } from './SpeckleMaterial.js'
import { ExtendedInstancedMesh } from '../objects/ExtendedInstancedMesh.js'

class SpeckleDepthNormalIdMaterial extends SpeckleDepthNormalMaterial {
  protected get vertexProgram(): string {
    return speckleDepthNormalIdVert
  }

  protected get fragmentProgram(): string {
    return speckleDepthNormalIdFrag
  }

  protected get uniformsDef(): Uniforms {
    return { ...super.uniformsDef, batchIndex: 0 }
  }

  onBeforeRender(
    _this: SpeckleWebGLRenderer,
    _scene: Scene,
    _camera: Camera,
    _geometry: BufferGeometry,
    object: Object3D
  ) {
    if (this.defines && this.defines['USE_RTE']) {
      object.modelViewMatrix.copy(_this.RTEBuffers.rteViewModelMatrix)
      this.userData.uViewer_low.value.copy(_this.RTEBuffers.viewerLow)
      this.userData.uViewer_high.value.copy(_this.RTEBuffers.viewerHigh)
      this.userData.rteModelViewMatrix.value.copy(_this.RTEBuffers.rteViewModelMatrix)
    }

    if (object instanceof SpeckleMesh || object instanceof ExtendedInstancedMesh) {
      this.userData.batchIndex.value = object.batchIndex
    }

    this.needsUpdate = true
  }
}

export default SpeckleDepthNormalIdMaterial
