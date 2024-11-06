import { BatchObject } from '@speckle/viewer'
import { Vector3 } from 'three'

export interface Animation {
  target: BatchObject
  start: Vector3
  end: Vector3
  current: Vector3
  time: number
}

const ZERO = 1e-8
const ONE = 1 - 1e-8

const easeOutQuart = (x: number) => {
  return 1 - Math.pow(1 - x, 4)
}

export class AnimationGroup {
  /** We'll store our animations here */
  public animations: Animation[] = []
  /** Animation params */
  public animTimeScale: number = 0.25
  private reverse = false

  public update(deltaTime: number): number {
    if (!this.animations.length) return 0

    let animCount = 0
    for (let k = 0; k < this.animations.length; k++) {
      /** Animation finished, no need to update it */
      if (this.animations[k].time === 1 || this.animations[k].time === 0) {
        continue
      }
      /** Compute the next animation time value */
      const t =
        this.animations[k].time +
        (this.reverse
          ? -(deltaTime * this.animTimeScale)
          : deltaTime * this.animTimeScale)

      /** Clamp it to 1 */
      this.animations[k].time = Math.min(Math.max(t, 0), 1)
      let easedT = easeOutQuart(this.animations[k].time)
      if (this.animations[k].time === 1) easedT = 1
      if (this.animations[k].time === 0) easedT = 0

      /** Compute current position value based on animation time */
      const value = new Vector3().copy(this.animations[k].start).lerp(
        this.animations[k].end,
        easedT // Added easing
      )
      /** Apply the translation */
      this.animations[k].target.transformTRS(value, undefined, undefined, undefined)
      animCount++
    }

    return animCount
  }

  public play() {
    this.reverse = false
    for (let k = 0; k < this.animations.length; k++) {
      this.animations[k].time = ZERO
    }
  }

  public playReverse() {
    for (let k = 0; k < this.animations.length; k++) {
      this.animations[k].time = ONE
    }
    this.reverse = true
  }

  public clear() {
    this.animations = []
    this.reverse = false
  }
}
