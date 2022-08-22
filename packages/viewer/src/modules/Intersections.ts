import { Box3, Camera, Intersection, Raycaster, Scene, Vector2 } from 'three'

export class Intersections {
  private raycaster: Raycaster

  public constructor() {
    this.raycaster = new Raycaster()
    this.raycaster.params.Line = { threshold: 0.1 }
    ;(this.raycaster.params as { Line2? }).Line2 = {}
    /** We need to set this dynamically according to the scene's relative size
     *  Because it's in world space
     */
    ;(this.raycaster.params as { Line2? }).Line2.threshold = 1
  }

  public intersect(
    scene: Scene,
    camera: Camera,
    point: Vector2,
    nearest = true,
    bounds: Box3 = null
  ): Intersection {
    this.raycaster.setFromCamera(point, camera)
    const target = scene.getObjectByName('ContentGroup')
    let results = []
    if (target) {
      results = this.raycaster.intersectObjects(target.children)
    }

    if (results.length === 0) return null
    if (nearest) results.sort((value) => value.distance)
    if (bounds) {
      if (!bounds.containsPoint(results[0].point)) {
        console.warn('Object clipped. Rejecting!')
        return null
      }
    }

    return results[0]
  }
}
