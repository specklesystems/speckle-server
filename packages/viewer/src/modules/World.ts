import { Box3, Vector3, Matrix4 } from 'three'
import { OBB } from 'three/examples/jsm/math/OBB.js'

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

const MatBuff0: Matrix4 = new Matrix4()
const MatBuff1: Matrix4 = new Matrix4()
const MatBuff2: Matrix4 = new Matrix4()

export class World {
  private readonly boxes: Array<Box3> = new Array<Box3>()
  public readonly worldBox: Box3 = new Box3()
  private readonly VecBuff: Vector3 = new Vector3()
  private readonly BoxBuff0: Box3 = new Box3()
  private readonly BoxBuff1: Box3 = new Box3()

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
    if (this.worldBox.isEmpty()) return offsetAmount

    MatBuff0.identity()
    MatBuff0.makeScale(1 + offsetAmount, 1 + offsetAmount, 1 + offsetAmount)
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
    const offsetBox = this.BoxBuff1.copy(sizeBox).applyMatrix4(MatBuff0)
    const dist = offsetBox.max.distanceTo(sizeBox.max)
    return dist
  }

  public getRelativeOffsetBox(box: Box3, offsetAmount: number = 0.001) {
    if (this.worldBox.isEmpty()) return box

    const center = box.getCenter(new Vector3())
    MatBuff1.makeTranslation(center.x, center.y, center.z)
    MatBuff2.copy(MatBuff1).invert()
    MatBuff0.identity()
    MatBuff0.makeScale(1 + offsetAmount, 1 + offsetAmount, 1 + offsetAmount)
    const offsetBox = new Box3().copy(box)
    offsetBox.applyMatrix4(MatBuff2)
    offsetBox.applyMatrix4(MatBuff0)
    offsetBox.applyMatrix4(MatBuff1)
    return offsetBox
  }

  public static expandBoxRelative<T extends OBB | Box3>(
    box: T,
    offsetAmount: number = 0.001
  ): T {
    if (box.isEmpty()) return box

    if (box instanceof Box3) return World.expandBox3Relative(box, offsetAmount) as T
    else return World.expandOBBRelative(box, offsetAmount) as T
  }

  private static expandBox3Relative(box: Box3, offsetAmount: number): Box3 {
    const center = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3())
    MatBuff1.makeTranslation(center.x, center.y, center.z)
    MatBuff2.copy(MatBuff1).invert()
    MatBuff0.identity()
    MatBuff0.makeScale(1 + offsetAmount, 1 + offsetAmount, 1 + offsetAmount)
    const offsetBox = new Box3().copy(box)
    if (size.x === 0) {
      offsetBox.min.x += -offsetAmount * 0.5
      offsetBox.max.x += offsetAmount * 0.5
    }
    if (size.y === 0) {
      offsetBox.min.y += -offsetAmount * 0.5
      offsetBox.max.y += offsetAmount * 0.5
    }
    if (size.z === 0) {
      offsetBox.min.z += -offsetAmount * 0.5
      offsetBox.max.z += offsetAmount * 0.5
    }
    offsetBox.applyMatrix4(MatBuff2)
    offsetBox.applyMatrix4(MatBuff0)
    offsetBox.applyMatrix4(MatBuff1)

    return offsetBox
  }

  private static expandOBBRelative(box: OBB, offsetAmount: number): OBB {
    const center = box.center
    const size = box.getSize(new Vector3())
    MatBuff1.makeTranslation(center.x, center.y, center.z)
    MatBuff2.copy(MatBuff1).invert()
    MatBuff0.identity()
    MatBuff0.makeScale(1 + offsetAmount, 1 + offsetAmount, 1 + offsetAmount)
    const offsetBox = new OBB().copy(box)
    if (size.x === 0) {
      offsetBox.halfSize.x += offsetAmount * 0.5
    }
    if (size.y === 0) {
      offsetBox.halfSize.y += offsetAmount * 0.5
    }
    if (size.z === 0) {
      offsetBox.halfSize.z += offsetAmount * 0.5
    }
    offsetBox.applyMatrix4(MatBuff2)
    offsetBox.applyMatrix4(MatBuff0)
    offsetBox.applyMatrix4(MatBuff1)

    return offsetBox
  }
}
