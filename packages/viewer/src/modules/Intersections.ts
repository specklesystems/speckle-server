import { Raycaster, Scene } from 'three'
import Batcher from './Batcher'
import { SpeckleType } from './converter/GeometryConverter'
import { WorldTree } from './converter/WorldTree'

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

    console.warn(WorldTree.getInstance().findId('2d10312df9a1910074ab5b0426ea89d3'))
    const rendeViews = WorldTree.getRenderTree()
      .getRenderViews(SpeckleType.Arc)
      .sort((a, b) => {
        return a.batchStart - b.batchStart
      })
    console.warn(rendeViews)

    results.sort((value) => value.distance)
    console.warn(results[0])
    const rv = this.batcher.getRenderView(results[0].object.uuid, results[0].faceIndex)
    console.warn(rv)
    this.batcher.selectRenderView(rv)
  }
}
