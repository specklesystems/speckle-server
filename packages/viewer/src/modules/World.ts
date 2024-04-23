import { Box3, Vector3, Matrix4 } from 'three'

export class AsyncPause {
  private lastPauseTime: number = 0
  public needsWait: boolean = false

  public tick(maxDelta: number) {
    const now = performance.now()
    const delta = now - this.lastPauseTime
    // console.log('Delta -> ', delta)
    if (delta > maxDelta) {
      this.needsWait = true
    }
  }

  public async wait(waitTime: number) {
    this.lastPauseTime = performance.now()
    await new Promise((resolve) => setTimeout(resolve, waitTime))
    this.needsWait = false
  }
}

export class World {
  private readonly boxes: Array<Box3> = new Array<Box3>()
  public readonly worldBox: Box3 = new Box3()
  private readonly VecBuff: Vector3 = new Vector3()
  private readonly BoxBuff0: Box3 = new Box3()
  private readonly BoxBuff1: Box3 = new Box3()
  private readonly MatBuff: Matrix4 = new Matrix4()

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

  public getRelativeOffset(offsetAmount: number = 0.001): number {
    this.MatBuff.identity()
    this.MatBuff.makeScale(1 + offsetAmount, 1 + offsetAmount, 1 + offsetAmount)
    const worldSize = this.VecBuff.set(
      this.worldSize.x * 0.5,
      this.worldSize.y * 0.5,
      this.worldSize.z * 0.5
    )
    this.BoxBuff0.min.set(0, 0, 0)
    this.BoxBuff0.max.set(0, 0, 0)
    this.BoxBuff1.min.set(0, 0, 0)
    this.BoxBuff1.max.set(0, 0, 0)
    const sizeBox = this.BoxBuff0.expandByVector(worldSize)
    const offsetBox = this.BoxBuff1.copy(sizeBox).applyMatrix4(this.MatBuff)
    const dist = offsetBox.max.distanceTo(sizeBox.max)
    return dist
  }
}
