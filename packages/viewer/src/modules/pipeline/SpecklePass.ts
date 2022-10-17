import { Camera, Plane, Scene, Texture } from 'three'
import { RenderType } from './Pipeline'

export type InputColorTextureUniform = 'tDiffuse'
export type InputDepthTextureUniform = 'tDepth'
export type InputNormalsTextureUniform = 'tNormal'
export type InputColorInterpolateTextureUniform = 'tDiffuseInterp'

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
  setRenderType?(type: RenderType)
}
