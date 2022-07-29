import { Camera, Intersection, Raycaster, Scene, Vector2 } from 'three'

export class Intersections {
  private raycaster: Raycaster

  public constructor() {
    this.raycaster = new Raycaster()
    this.raycaster.params.Line = { threshold: 0.1 }
    ;(this.raycaster.params as { Line2? }).Line2 = {}
    /** We need to set this dynamically according to the scene's relative size
     *  Because it's in world space
     */
    ;(this.raycaster.params as { Line2? }).Line2.threshold = 0.1
  }

  public intersect(
    scene: Scene,
    camera: Camera,
    point: Vector2,
    nearest = true
  ): Intersection {
    this.raycaster.setFromCamera(point, camera)
    const target = scene.getObjectByName('ContentGroup')
    const results = this.raycaster.intersectObjects(target.children)

    if (results.length === 0) return null
    if (nearest) results.sort((value) => value.distance)
    return results[0]
  }
}
