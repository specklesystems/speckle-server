import { Vector3 } from 'three'
import { Extension } from './Extension.js'
import { UpdateFlags } from '../../IViewer.js'

export class ExplodeExtension extends Extension {
  protected _enabled: boolean = true

  public get enabled(): boolean {
    return this._enabled
  }
  public set enabled(value: boolean) {
    this._enabled = value
  }

  private explodeTime = -1
  private explodeRange = 0

  public onEarlyUpdate() {
    if (!this._enabled) return

    if (this.explodeTime > -1) {
      this.explode(this.explodeTime, this.explodeRange)
      this.explodeTime = -1
    }
  }
  public setExplode(time: number) {
    const size = this.viewer.World.worldSize
    this.explodeTime = time
    this.explodeRange = Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z)
  }

  private explode(time: number, range: number) {
    const objects = this.viewer.getRenderer().getObjects()
    const vecBuff = new Vector3()
    for (let i = 0; i < objects.length; i++) {
      const center = objects[i].aabb.getCenter(vecBuff)
      const dir = center.sub(this.viewer.World.worldOrigin)
      dir.normalize().multiplyScalar(time * range)

      objects[i].transformTRS(dir, undefined, undefined, undefined)
    }
    this.viewer.requestRender(UpdateFlags.RENDER_RESET | UpdateFlags.SHADOWS)
  }
}
