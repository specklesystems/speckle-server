import { Extension, Vector3 } from '../..'
import { GeometryType } from '../batching/Batch'
import MeshBatch from '../batching/MeshBatch'

export class ExplodeExtension extends Extension {
  private explodeTime = -1
  private explodeRange = 0

  public onLateUpdate() {
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
    const batches: MeshBatch[] = this.viewer
      .getRenderer()
      .batcher.getBatches(undefined, GeometryType.MESH) as MeshBatch[]
    const vecBuff: Vector3 = new Vector3()
    for (let k = 0; k < batches.length; k++) {
      const objects = batches[k].mesh.batchObjects
      for (let i = 0; i < objects.length; i++) {
        const center = objects[i].renderView.aabb.getCenter(vecBuff)
        const dir = center.sub(this.viewer.World.worldOrigin)
        dir.normalize().multiplyScalar(time * range)

        objects[i].transformTRS(dir, undefined, undefined, undefined)
      }
      batches[k].mesh.transformsDirty = true
    }

    // this.renderer.shadowMap.needsUpdate = true
    this.viewer.requestRender()
  }
}
