import {
  Camera,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Scene,
  Texture,
  WebGLRenderTarget
} from 'three'
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js'
import { ObjectLayers } from '../../IViewer'

export enum RenderType {
  NORMAL,
  ACCUMULATION
}

export type InputColorTextureUniform = 'tDiffuse'
export type InputDepthTextureUniform = 'tDepth'
export type InputNormalsTextureUniform = 'tNormal'
export type InputColorInterpolateTextureUniform = 'tDiffuseInterp'

export interface SpecklePass {
  onBeforeRender?: () => void
  onAferRender?: () => void
  outputRenderTarget?: WebGLRenderTarget

  get displayName(): string
  get outputTexture(): Texture | null

  update?(
    scene: Scene | null,
    camera: PerspectiveCamera | OrthographicCamera | null
  ): void
  setTexture?(uName: string, texture: Texture): void
  setParams?(params: unknown): void
  setClippingPlanes?(planes: Plane[]): void
  setLayers?(layers: ObjectLayers[]): void
}

export interface SpeckleProgressivePass extends SpecklePass {
  setFrameIndex(index: number): void
  setAccumulationFrames(frames: number): void
  setRenderType?(type: RenderType): void
}

export abstract class BaseSpecklePass extends Pass implements SpecklePass {
  protected layers: ObjectLayers[] | null = null
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
  get outputTexture(): Texture | null {
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
