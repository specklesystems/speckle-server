import { Camera, Plane, Scene, Texture } from 'three'
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js'
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
  protected _enabledLayers: ObjectLayers[] = []

  public get enabledLayers(): ObjectLayers[] {
    return this._enabledLayers
  }

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
    this._enabledLayers = layers.slice()
  }

  public enableLayer(layer: ObjectLayers, value: boolean) {
    if (this._enabledLayers.includes(layer)) {
      if (!value) this._enabledLayers.splice(this._enabledLayers.indexOf(layer), 1)
    } else {
      if (value) this._enabledLayers.push(layer)
    }
  }

  protected applyLayers(camera: Camera) {
    if (this.layers === null) {
      camera.layers.enableAll()
      return
    }
    camera.layers.disableAll()
    this.layers.forEach((layer) => {
      if (this._enabledLayers.includes(layer)) camera.layers.enable(layer)
    })
  }
}
