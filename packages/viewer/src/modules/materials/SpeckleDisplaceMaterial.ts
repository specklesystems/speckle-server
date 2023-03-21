/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleDisplaceVert } from './shaders/speckle-displace.vert'
import { speckleDisplaceFrag } from './shaders/speckle-displace-frag'
import { UniformsUtils, ShaderLib, Vector3, Vector2, Matrix4 } from 'three'
import SpeckleBasicMaterial from './SpeckleBasicMaterial'
import { Geometry } from '../converter/Geometry'
import SpeckleMesh from '../objects/SpeckleMesh'

class SpeckleDisplaceMaterial extends SpeckleBasicMaterial {
  constructor(parameters, defines = []) {
    super(parameters)

    this.userData.uViewer_high = {
      value: new Vector3()
    }
    this.userData.uViewer_low = {
      value: new Vector3()
    }
    this.userData.size = {
      value: new Vector2()
    }
    this.userData.displacement = {
      value: 0
    }
    this.userData.uTransforms = {
      value: [new Matrix4()]
    }
    this.userData.tTransforms = {
      value: null
    }
    ;(this as any).vertProgram = speckleDisplaceVert
    ;(this as any).fragProgram = speckleDisplaceFrag
    ;(this as any).uniforms = UniformsUtils.merge([
      ShaderLib.standard.uniforms,
      {
        uViewer_high: {
          value: this.userData.uViewer_high.value
        },
        uViewer_low: {
          value: this.userData.uViewer_low.value
        },
        size: {
          value: this.userData.size.value
        },
        displacement: {
          value: this.userData.displacement.value
        },
        uTransforms: {
          value: this.userData.uTransforms.value
        },
        tTransforms: {
          value: this.userData.tTransforms.value
        }
      }
    ])

    this.onBeforeCompile = function (shader) {
      shader.uniforms.uViewer_high = this.userData.uViewer_high
      shader.uniforms.uViewer_low = this.userData.uViewer_low
      shader.uniforms.size = this.userData.size
      shader.uniforms.displacement = this.userData.displacement
      shader.uniforms.uTransforms = this.userData.uTransforms
      shader.uniforms.tTransforms = this.userData.tTransforms
      shader.vertexShader = this.vertProgram
      shader.fragmentShader = this.fragProgram
    }

    if (defines) {
      this.defines = {}
    }
    for (let k = 0; k < defines.length; k++) {
      this.defines[defines[k]] = ' '
    }
  }

  onBeforeRender(_this, scene, camera, geometry, object, group) {
    SpeckleBasicMaterial.matBuff.copy(camera.matrixWorldInverse)
    SpeckleBasicMaterial.matBuff.elements[12] = 0
    SpeckleBasicMaterial.matBuff.elements[13] = 0
    SpeckleBasicMaterial.matBuff.elements[14] = 0
    SpeckleBasicMaterial.matBuff.multiply(object.matrixWorld)
    object.modelViewMatrix.copy(SpeckleBasicMaterial.matBuff)

    SpeckleBasicMaterial.vecBuff0.set(
      camera.matrixWorld.elements[12],
      camera.matrixWorld.elements[13],
      camera.matrixWorld.elements[14]
    )

    Geometry.DoubleToHighLowVector(
      SpeckleBasicMaterial.vecBuff0,
      SpeckleBasicMaterial.vecBuff1,
      SpeckleBasicMaterial.vecBuff2
    )

    this.userData.uViewer_low.value.copy(SpeckleBasicMaterial.vecBuff1)
    this.userData.uViewer_high.value.copy(SpeckleBasicMaterial.vecBuff2)
    ;(object as SpeckleMesh).updateMaterialTransformsUniform(this)

    this.needsUpdate = true
  }
}

export default SpeckleDisplaceMaterial
