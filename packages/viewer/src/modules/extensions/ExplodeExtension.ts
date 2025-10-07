import { Box3, Vector3 } from 'three'
import { Extension } from './Extension.js'
import { UpdateFlags } from '../../IViewer.js'

export enum ExplodeEvent {
  Finshed = 'explode-finished'
}

export interface ViewModeEventPayload {
  [ExplodeEvent.Finshed]: void
}

export class ExplodeExtension extends Extension {
  protected _enabled: boolean = true

  public get enabled(): boolean {
    return this._enabled
  }
  public set enabled(value: boolean) {
    this._enabled = value
  }

  /** Similar to SpeckleRenderer's visibleSceneBox, but with static boxes from render views */
  public get visibleWorld(): Box3 {
    const bounds: Box3 = new Box3()
    const batches = this.viewer.getRenderer().batcher.getBatches()
    for (let k = 0; k < batches.length; k++) {
      const batch = batches[k]
      const rvs = batch.renderViews.slice()
      rvs.sort((a, b) => {
        return a.batchStart - b.batchStart
      })

      const visibleRange = batch.getVisibleRange()
      let lo = 0,
        hi = rvs.length
      while (lo < hi) {
        const mid = (lo + hi) >>> 1
        if (rvs[mid].batchStart < visibleRange.offset) lo = mid + 1
        else hi = mid
      }

      const qStart = visibleRange.offset
      const qEnd = visibleRange.offset + visibleRange.count

      for (; lo < rvs.length; lo++) {
        const s = rvs[lo]
        if (s.batchStart >= qEnd) break
        const sEnd = s.batchStart + s.batchCount
        if (s.batchStart >= qStart && sEnd <= qEnd) {
          bounds.union(s.aabb)
        }
      }
    }
    return bounds
  }

  private explodeTime = -1
  private explodeRange = 0
  private explodeOrigin: Vector3 = new Vector3()

  public onEarlyUpdate() {
    if (!this._enabled) return

    if (this.explodeTime > -1) {
      this.explode(this.explodeTime, this.explodeRange)
      this.explodeTime = -1
    }
  }
  public setExplode(time: number) {
    const visibleWorld = this.visibleWorld
    const size = visibleWorld.getSize(new Vector3())
    this.explodeTime = time
    this.explodeRange = Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z)
    visibleWorld.getCenter(this.explodeOrigin)
  }

  private explode(time: number, range: number) {
    const objects = this.viewer.getRenderer().getObjects()
    const vecBuff = new Vector3()
    for (let i = 0; i < objects.length; i++) {
      const center = objects[i].aabb.getCenter(vecBuff)
      const dir = center.sub(this.explodeOrigin)
      dir.normalize().multiplyScalar(time * range)

      objects[i].transformTRS(dir, undefined, undefined, undefined)
    }
    this.viewer.requestRender(UpdateFlags.RENDER_RESET | UpdateFlags.SHADOWS)
    this.emit(ExplodeEvent.Finshed)
  }
}
