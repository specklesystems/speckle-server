/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { specklePointVert } from './shaders/speckle-point-vert'
import { specklePointFrag } from './shaders/speckle-point-frag'
import { PointsMaterial } from 'three'

class SpecklePointMaterial extends PointsMaterial {
  constructor(parameters, defines = []) {
    super(parameters)
    ;(this as any).vertProgram = specklePointVert
    ;(this as any).fragProgram = specklePointFrag

    this.onBeforeCompile = function (shader) {
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

  copy(source) {
    super.copy(source)
    this.userData = {}
    return this
  }
}

export default SpecklePointMaterial
