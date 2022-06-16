import { Raycaster, Scene } from 'three'
import Batcher from './batching/Batcher'

export class Intersections {
  private scene: Scene
  private batcher: Batcher
  private lastTimeCall = 0

  public constructor(scene: Scene, batcher: Batcher) {
    this.scene = scene
    this.batcher = batcher
    this.batcher
  }

  public intersectScene(raycaster: Raycaster) {
    if (performance.now() - this.lastTimeCall < 100) return
    this.lastTimeCall = performance.now()
    const target = this.scene.getObjectByName('ContentGroup')
    const results = raycaster.intersectObjects(target.children)
    if (!results.length) {
      this.batcher.resetBatchesDrawGroups()
      return
    }

    results.sort((value) => value.distance)
    console.warn(results[0])
    const rv = this.batcher.getRenderView(results[0].object.uuid, results[0].faceIndex)
    console.warn(rv)
    this.batcher.selectRenderView(rv)
  }
}
