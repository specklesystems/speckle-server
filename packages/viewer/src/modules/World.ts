import { Box3, Vector3 } from 'three'

export class World {
  /* This will no longer exist when we have a scene tree */
  private static readonly boxes: Array<Box3> = new Array<Box3>()
  public static readonly worldBox: Box3 = new Box3()

  private static _worldOrigin: Vector3 = new Vector3()
  public static get worldSize() {
    World.worldBox.getCenter(this._worldOrigin)
    const size = new Vector3().subVectors(World.worldBox.max, World.worldBox.min)
    return {
      x: size.x,
      y: size.y,
      z: size.z
    }
  }

  public static get worldOrigin() {
    return World._worldOrigin
  }

  public static expandWorld(box: Box3) {
    World.boxes.push(box)
    World.updateWorld()
  }

  public static reduceWorld(box: Box3) {
    World.boxes.splice(World.boxes.indexOf(box), 1)
    World.updateWorld()
  }

  public static updateWorld() {
    World.worldBox.makeEmpty()
    for (let k = 0; k < this.boxes.length; k++) {
      World.worldBox.union(World.boxes[k])
    }
  }

  public static resetWorld() {
    World.worldBox.makeEmpty()
    this.boxes.length = 0
  }
}
