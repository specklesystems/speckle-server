import {
  Camera,
  Material,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Scene,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three'
import { ObjectLayers } from '../../../IViewer.js'

export enum ObjectVisibility {
  OPAQUE = 'opaque',
  TRANSPARENT = 'transparent',
  DEPTH = 'depth',
  STENCIL = 'stencil'
}

export enum ClearFlags {
  COLOR = 0x00000100,
  DEPTH = 0x00000400,
  STENCIL = 0x00004000
}

export interface PassOptions {}

export interface GPass {
  get displayName(): string
  set outputTarget(value: WebGLRenderTarget)
  get outputTarget(): WebGLRenderTarget | null
  get enabled(): boolean
  set enabled(value: boolean)
  set options(value: PassOptions)
  get visibility(): ObjectVisibility | null
  get overrideMaterial(): Material | null
  get overrideBatchMaterial(): Material | null
  get jitter(): boolean
  get clearColor(): number | undefined
  get clearAlpha(): number | undefined
  get clearFlags(): number | undefined

  setSize?(width: number, height: number): void
  onBeforeRender?: () => void
  onAferRender?: () => void
  update?(camera: PerspectiveCamera | OrthographicCamera | null): void
  render?(
    renderer: WebGLRenderer,
    camera?: PerspectiveCamera | OrthographicCamera | null,
    scene?: Scene
  ): boolean
  setClearColor(color: number, alpha: number): void
  setClearFlags(flags: number): void
  setClippingPlanes?(planes: Plane[]): void
  setLayers?(layers: ObjectLayers[]): void
  setVisibility?(objectVisibility: ObjectVisibility): void
  setJitter(value: boolean): void
}

export abstract class BaseGPass implements GPass {
  protected _enabled: boolean = true
  protected layers: ObjectLayers[] | null = null
  protected _enabledLayers: ObjectLayers[] = []
  protected _objectVisibility: ObjectVisibility | null = null
  protected _jitter: boolean = false
  protected _options: PassOptions = {}
  protected _clearColor: number | undefined = undefined
  protected _clearAlpha: number | undefined = undefined
  protected _clearFlags: number | undefined = undefined

  protected _outputTarget: WebGLRenderTarget | null = null

  public onBeforeRender: (() => void) | undefined = undefined
  public onAfterRender: (() => void) | undefined = undefined

  public get enabledLayers(): ObjectLayers[] {
    return this._enabledLayers
  }

  get displayName(): string {
    return 'BASE'
  }
  get outputTarget(): WebGLRenderTarget | null {
    return this._outputTarget
  }

  set outputTarget(value: WebGLRenderTarget | null) {
    this._outputTarget = value
  }

  get enabled(): boolean {
    return this._enabled
  }

  set enabled(value: boolean) {
    this._enabled = value
  }

  set options(value: PassOptions) {
    Object.assign(this._options, value)
  }

  get visibility() {
    return this._objectVisibility
  }

  get overrideMaterial(): Material | null {
    return null
  }

  get overrideBatchMaterial(): Material | null {
    return null
  }

  get jitter(): boolean {
    return this._jitter
  }

  get clearColor(): number | undefined {
    return this._clearColor
  }

  get clearAlpha(): number | undefined {
    return this._clearAlpha
  }

  get clearFlags(): number | undefined {
    return this._clearFlags
  }

  public setClearColor(color: number, alpha: number) {
    this._clearColor = color
    this._clearAlpha = alpha
  }

  public setClearFlags(flags: number) {
    this._clearFlags = flags
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

  public setVisibility(objectVisibility: ObjectVisibility) {
    this._objectVisibility = objectVisibility
  }

  public setJitter(value: boolean) {
    this._jitter = value
  }

  protected applyLayers(camera: Camera | null) {
    if (camera === null) return

    if (this.layers === null) {
      camera.layers.enableAll()
      return
    }
    camera.layers.disableAll()
    this.layers.forEach((layer) => {
      if (this._enabledLayers.includes(layer)) camera.layers.enable(layer)
    })
  }

  protected clear(renderer: WebGLRenderer) {
    if (this._clearColor !== undefined)
      renderer.setClearColor(this._clearColor, this._clearAlpha || 0)
    if (this._clearColor !== undefined || this._clearFlags !== undefined)
      renderer.clear(
        this._clearColor !== undefined ||
          (this._clearFlags !== undefined && !!(this._clearFlags & ClearFlags.COLOR)),
        this._clearFlags !== undefined && !!(this._clearFlags & ClearFlags.DEPTH),
        this._clearFlags !== undefined && !!(this._clearFlags & ClearFlags.STENCIL)
      )
  }

  abstract render(
    renderer: WebGLRenderer,
    camera?: PerspectiveCamera | OrthographicCamera | null,
    scene?: Scene
  ): boolean

  public setSize(width: number, height: number) {
    this._outputTarget?.setSize(width, height)
  }
}

export abstract class ProgressiveGPass extends BaseGPass {
  protected _frameIndex = 0
  protected _accumulationFrames = 0

  get frameIndex(): number {
    return this._frameIndex
  }
  set frameIndex(value: number) {
    this._frameIndex = value
  }

  get accumulationFrames(): number {
    return this._accumulationFrames
  }
  set accumulationFrames(value: number) {
    this._accumulationFrames = value
  }

  public render(
    renderer: WebGLRenderer,
    camera?: PerspectiveCamera | OrthographicCamera | null,
    scene?: Scene
  ): boolean {
    /** Thank you eslint */
    renderer
    camera
    scene
    if (this._frameIndex >= this._accumulationFrames - 1) {
      return false
    }
    return true
  }
}
