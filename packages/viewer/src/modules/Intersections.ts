import { Raycaster, Scene } from 'three'
import Batcher from './Batcher'

export class Intersections {
  private scene: Scene
  private batcher: Batcher

  public constructor(scene: Scene, batcher: Batcher) {
    this.scene = scene
    this.batcher = batcher
    this.batcher
  }

  public intersectScene(raycaster: Raycaster) {
    const target = this.scene.getObjectByName('ContentGroup')
    const results = raycaster.intersectObjects(target.children)
    results.sort((value) => value.distance)
    // console.log(
    //   this.batcher.getRenderView(results[0].object.uuid, results[0].faceIndex)
    // )
  }
}
