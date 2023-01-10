import { Box3, Vector3 } from 'three'

export class World {
  private readonly boxes: Array<Box3> = new Array<Box3>()
  public readonly worldBox: Box3 = new Box3()

  private _worldOrigin: Vector3 = new Vector3()
  public get worldSize() {
    this.worldBox.getCenter(this._worldOrigin)
    const size = new Vector3().subVectors(this.worldBox.max, this.worldBox.min)
    return {
      x: size.x,
      y: size.y,
      z: size.z
    }
  }

  public get worldOrigin() {
    return this._worldOrigin
  }

  public expandWorld(box: Box3) {
    this.boxes.push(box)
    this.updateWorld()
  }

  public reduceWorld(box: Box3) {
    this.boxes.splice(this.boxes.indexOf(box), 1)
    this.updateWorld()
  }

  public updateWorld() {
    this.worldBox.makeEmpty()
    for (let k = 0; k < this.boxes.length; k++) {
      this.worldBox.union(this.boxes[k])
    }
  }

  public resetWorld() {
    this.worldBox.makeEmpty()
    this.boxes.length = 0
  }
}
