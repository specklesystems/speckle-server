import { Camera, Scene, Texture } from 'three'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { SpecklePass } from './SpecklePass'

export class ColorPass extends RenderPass implements SpecklePass {
  public constructor(scene: Scene, camera: Camera) {
    super(scene, camera)
  }
  public get displayName(): string {
    return 'COLOR'
  }
  public get outputTexture(): Texture {
    return null
  }
}
