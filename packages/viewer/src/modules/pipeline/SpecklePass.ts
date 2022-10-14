import { Camera, Plane, Scene, Texture } from 'three'

export type InputColorTextureUniform = 'tDiffuse'
export type InputDepthTextureUniform = 'tDepth'
export type InputNormalsTextureUniform = 'tNormal'

export interface SpecklePass {
  onBeforeRender?: () => void
  onAferRender?: () => void

  get displayName(): string
  get outputTexture(): Texture

  update?(scene: Scene, camera: Camera)
  setTexture?(uName: string, texture: Texture)
  setParams?(params: unknown)
  setClippingPlanes?(planes: Plane[])
}

export interface SpeckleProgressivePass extends SpecklePass {
  setFrameIndex(index: number)
}
