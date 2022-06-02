import { Box3 } from 'three'

export class World {
  /* This will no longer exist when we have a scene tree */
  private static readonly boxes: Array<Box3> = new Array<Box3>()
  public static readonly worldBox: Box3 = new Box3()

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
