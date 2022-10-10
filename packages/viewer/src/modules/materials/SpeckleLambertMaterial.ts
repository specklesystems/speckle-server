/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleLambertVert } from './shaders/speckle-lambert-vert'
import { speckleLambertFrag } from './shaders/speckle-lambert-frag'
import { UniformsUtils, ShaderLib, Vector3, MeshLambertMaterial } from 'three'
import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'

class SpeckleLambertMaterial extends MeshLambertMaterial {
  private static readonly matBuff: Matrix4 = new Matrix4()
  private static readonly vecBuff0: Vector3 = new Vector3()
  private static readonly vecBuff1: Vector3 = new Vector3()
  private static readonly vecBuff2: Vector3 = new Vector3()

  constructor(parameters, defines = []) {
    super(parameters)

    this.userData.uViewer_high = {
      value: new Vector3()
    }
    this.userData.uViewer_low = {
      value: new Vector3()
    }
    ;(this as any).vertProgram = speckleLambertVert
    ;(this as any).fragProgram = speckleLambertFrag
    ;(this as any).uniforms = UniformsUtils.merge([
      ShaderLib.standard.uniforms,
      {
        uViewer_high: {
          value: this.userData.uViewer_high.value
        },
        uViewer_low: {
          value: this.userData.uViewer_low.value
        }
      }
    ])

    this.onBeforeCompile = function (shader) {
      shader.uniforms.uViewer_high = this.userData.uViewer_high
      shader.uniforms.uViewer_low = this.userData.uViewer_low
      shader.vertexShader = this.vertProgram
      shader.fragmentShader = this.fragProgram
    }

    if (defines) {
      this.defines = {}
    }
    for (let k = 0; k < defines.length; k++) {
      this.defines[defines[k]] = ''
    }
  }

  copy(source) {
    super.copy(source)
    this.userData = {}
    this.userData.uViewer_high = {
      value: new Vector3()
    }
    this.userData.uViewer_low = {
      value: new Vector3()
    }

    this.defines['USE_RTE'] = ' '

    return this
  }

  onBeforeRender(_this, scene, camera, geometry, object, group) {
    SpeckleLambertMaterial.matBuff.copy(camera.matrixWorldInverse)
    SpeckleLambertMaterial.matBuff.elements[12] = 0
    SpeckleLambertMaterial.matBuff.elements[13] = 0
    SpeckleLambertMaterial.matBuff.elements[14] = 0
    SpeckleLambertMaterial.matBuff.multiply(object.matrixWorld)
    object.modelViewMatrix.copy(SpeckleLambertMaterial.matBuff)

    SpeckleLambertMaterial.vecBuff0.set(
      camera.matrixWorld.elements[12],
      camera.matrixWorld.elements[13],
      camera.matrixWorld.elements[14]
    )

    Geometry.DoubleToHighLowVector(
      SpeckleLambertMaterial.vecBuff0,
      SpeckleLambertMaterial.vecBuff1,
      SpeckleLambertMaterial.vecBuff2
    )

    this.userData.uViewer_low.value.copy(SpeckleLambertMaterial.vecBuff1)
    this.userData.uViewer_high.value.copy(SpeckleLambertMaterial.vecBuff2)

    this.needsUpdate = true
  }
}

export default SpeckleLambertMaterial
