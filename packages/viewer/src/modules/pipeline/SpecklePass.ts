import { Camera, Plane, Scene, Texture } from 'three'
import { Pass } from 'three/examples/jsm/postprocessing/Pass'
import { ObjectLayers } from '../SpeckleRenderer'
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
  setLayers?(layers: ObjectLayers[])
}

export interface SpeckleProgressivePass extends SpecklePass {
  setFrameIndex(index: number)
  setRenderType?(type: RenderType)
}

export abstract class BaseSpecklePass extends Pass implements SpecklePass {
  protected layers: ObjectLayers[] = null

  constructor() {
    super()
  }

  get displayName(): string {
    return 'BASE'
  }
  get outputTexture(): Texture {
    return null
  }

  public setLayers(layers: ObjectLayers[]) {
    this.layers = layers
  }

  protected applyLayers(camera: Camera) {
    if (this.layers === null) {
      camera.layers.enableAll()
      return
    }
    camera.layers.disableAll()
    this.layers.forEach((layer) => {
      camera.layers.enable(layer)
    })
  }
}
