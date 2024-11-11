import { BatchObject } from '@speckle/viewer'
import { Vector3 } from 'three'

export interface Animation {
  target: BatchObject
  end: Vector3
  current: Vector3
  time: number
}

const ZERO = 1e-8
const ONE = 1 - 1e-8
const vec3: Vector3 = new Vector3()

const easeOutQuart = (x: number) => {
  return 1 - Math.pow(1 - x, 4)
}

export class AnimationGroup {
  /** We'll store our animations here */
  public animations: Animation[] = []
  /** Animation params */
  public animTimeScale: number = 1
  private _isReverse = false
  private _isAnimating = false

  public onStart: (() => void) | null = null
  public onComplete: (() => void) | null = null

  public get isAnimating(): boolean {
    return this._isAnimating
  }

  public set animationDuration(value: number) {
    this.animTimeScale = 1 / value
  }

  public update(deltaTime: number): number {
    if (!this.animations.length || !this._isAnimating) return 0

    let animCount = 0
    for (let k = 0; k < this.animations.length; k++) {
      /** Animation finished, no need to update it */
      if (this.animations[k].time === 1 || this.animations[k].time === 0) {
        continue
      }
      /** Compute the next animation time value */
      const t =
        this.animations[k].time +
        (this._isReverse
          ? -(deltaTime * this.animTimeScale)
          : deltaTime * this.animTimeScale)

      /** Clamp it to 1 */
      this.animations[k].time = Math.min(Math.max(t, 0), 1)
      let easedT = easeOutQuart(this.animations[k].time)
      if (this.animations[k].time === 1) easedT = 1
      if (this.animations[k].time === 0) easedT = 0

      /** Compute current position value based on animation time */
      vec3.set(0, 0, 0)
      const value = vec3.lerp(this.animations[k].end, easedT)
      /** Apply the translation */
      this.animations[k].target.transformTRS(value)
      animCount++
    }

    if (this._isAnimating && !animCount) {
      this._isAnimating = false
      if (this.onComplete) this.onComplete()
    }

    return animCount
  }

  public play() {
    for (let k = 0; k < this.animations.length; k++) {
      this.animations[k].time = ZERO
    }
    this._isReverse = false
    this._isAnimating = true
    if (this.onStart) this.onStart()
  }

  public reverse() {
    for (let k = 0; k < this.animations.length; k++) {
      this.animations[k].time = ONE
    }
    this._isReverse = true
    this._isAnimating = true
    if (this.onStart) this.onStart()
  }

  public clear() {
    this.animations = []
    this._isReverse = false
    this._isAnimating = false
  }
}
