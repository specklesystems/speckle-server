import CameraControls from 'camera-controls'
import { MathUtils, PerspectiveCamera, Vector3 } from 'three'

let ACTION
;(function (ACTION) {
  ACTION[(ACTION['NONE'] = 0)] = 'NONE'
  ACTION[(ACTION['ROTATE'] = 1)] = 'ROTATE'
  ACTION[(ACTION['TRUCK'] = 2)] = 'TRUCK'
  ACTION[(ACTION['OFFSET'] = 3)] = 'OFFSET'
  ACTION[(ACTION['DOLLY'] = 4)] = 'DOLLY'
  ACTION[(ACTION['ZOOM'] = 5)] = 'ZOOM'
  ACTION[(ACTION['TOUCH_ROTATE'] = 6)] = 'TOUCH_ROTATE'
  ACTION[(ACTION['TOUCH_TRUCK'] = 7)] = 'TOUCH_TRUCK'
  ACTION[(ACTION['TOUCH_OFFSET'] = 8)] = 'TOUCH_OFFSET'
  ACTION[(ACTION['TOUCH_DOLLY'] = 9)] = 'TOUCH_DOLLY'
  ACTION[(ACTION['TOUCH_ZOOM'] = 10)] = 'TOUCH_ZOOM'
  ACTION[(ACTION['TOUCH_DOLLY_TRUCK'] = 11)] = 'TOUCH_DOLLY_TRUCK'
  ACTION[(ACTION['TOUCH_DOLLY_OFFSET'] = 12)] = 'TOUCH_DOLLY_OFFSET'
  ACTION[(ACTION['TOUCH_ZOOM_TRUCK'] = 13)] = 'TOUCH_ZOOM_TRUCK'
  ACTION[(ACTION['TOUCH_ZOOM_OFFSET'] = 14)] = 'TOUCH_ZOOM_OFFSET'
})(ACTION || (ACTION = {}))
function isPerspectiveCamera(camera) {
  return camera.isPerspectiveCamera
}
function isOrthographicCamera(camera) {
  return camera.isOrthographicCamera
}

const EPSILON = 1e-5
function approxZero(number, error = EPSILON) {
  return Math.abs(number) < error
}
function approxEquals(a, b, error = EPSILON) {
  return approxZero(a - b, error)
}

let _deltaTarget, _deltaOffset, _v3A, _v3B, _v3C
let _xColumn
let _yColumn
let _zColumn

export class SpeckleCameraControls extends CameraControls {
  private _didDolly = false
  private _didDollyLastFrame = false
  public _isTrucking = false
  private _hasRestedLastFrame = false
  private _didZoom = false
  private overrideDollyLerpRatio = 0
  private overrideZoomLerpRatio = 0

  static install() {
    _v3A = new Vector3()
    _v3B = new Vector3()
    _v3C = new Vector3()
    _xColumn = new Vector3()
    _yColumn = new Vector3()
    _zColumn = new Vector3()
    _deltaTarget = new Vector3()
    _deltaOffset = new Vector3()
  }

  public get hasRested() {
    return this._hasRested
  }

  public set isTrucking(value: boolean) {
    this._isTrucking = value
  }

  protected _dollyInternal = (delta: number, x: number, y: number): void => {
    const dollyScale = Math.pow(0.95, -delta * this.dollySpeed)
    const distance = this._sphericalEnd.radius * dollyScale
    const prevRadius = this._sphericalEnd.radius
    const signedPrevRadius = prevRadius * (delta >= 0 ? -1 : 1)

    this.dollyTo(distance, true, 0.9)

    if (
      this.infinityDolly &&
      (distance < this.minDistance || this.maxDistance === this.minDistance)
    ) {
      this._camera.getWorldDirection(_v3A)
      this._targetEnd.add(_v3A.normalize().multiplyScalar(signedPrevRadius))
      this._target.add(_v3A.normalize().multiplyScalar(signedPrevRadius))
    }

    if (this.dollyToCursor) {
      this._dollyControlAmount += this._sphericalEnd.radius - prevRadius

      if (
        this.infinityDolly &&
        (distance < this.minDistance || this.maxDistance === this.minDistance)
      ) {
        this._dollyControlAmount -= signedPrevRadius
      }

      this._dollyControlCoord.set(x, y)
    }

    return
  }

  protected _zoomInternal = (delta: number, x: number, y: number): void => {
    const zoomScale = Math.pow(0.95, delta * this.dollySpeed)
    /** We need to move the camera as well when zooming in orthographic mode */
    const dollyScale = Math.pow(0.95, -delta * this.dollySpeed)
    const distance = this._sphericalEnd.radius * dollyScale
    this.dollyTo(distance, true, 0.9)

    // for both PerspectiveCamera and OrthographicCamera
    this.zoomTo(this._zoom * zoomScale, false, 1)
    this._didDolly = true
    this.dispatchEvent({ type: 'controlstart' })
    if (this.dollyToCursor) {
      this._dollyControlAmount = this._zoomEnd

      this._dollyControlCoord.set(x, y)
    }

    return
  }

  /**
   * Zoom in/out camera to given scale. The value overwrites camera zoom.
   * Limits set with .minZoom and .maxZoom
   * @param zoom
   * @param enableTransition
   * @category Methods
   */
  zoomTo(
    zoom: number,
    enableTransition = false,
    lerpRatio: number = undefined
  ): Promise<void> {
    this._zoomEnd = MathUtils.clamp(zoom, this.minZoom, this.maxZoom)
    this._needsUpdate = true
    this.overrideZoomLerpRatio = enableTransition ? 0.05 : lerpRatio
    if (!enableTransition) {
      this._zoom = this._zoomEnd
    }

    const resolveImmediately =
      !enableTransition || approxEquals(this._zoom, this._zoomEnd, this.restThreshold)
    return this._createOnRestPromise(resolveImmediately)
  }

  /**
   * Dolly in/out camera position to given distance.
   * @param distance Distance of dolly.
   * @param enableTransition Whether to move smoothly or immediately.
   * @category Methods
   */
  dollyTo(
    distance: number,
    enableTransition = true,
    lerpRatio = undefined
  ): Promise<void> {
    const lastRadius = this._sphericalEnd.radius
    const newRadius = MathUtils.clamp(distance, this.minDistance, this.maxDistance)
    const hasCollider = this.colliderMeshes.length >= 1

    if (hasCollider) {
      const maxDistanceByCollisionTest = this._collisionTest()
      const isCollided = approxEquals(
        maxDistanceByCollisionTest,
        this._spherical.radius
      )
      const isDollyIn = lastRadius > newRadius

      if (!isDollyIn && isCollided) return Promise.resolve()

      this._sphericalEnd.radius = Math.min(newRadius, maxDistanceByCollisionTest)
    } else {
      this._sphericalEnd.radius = newRadius
    }

    this._needsUpdate = true
    this.overrideDollyLerpRatio = lerpRatio

    if (!enableTransition) {
      this._spherical.radius = this._sphericalEnd.radius
      this._didDolly = true
      this.dispatchEvent({ type: 'controlstart' })
    }

    const resolveImmediately =
      !enableTransition ||
      approxEquals(
        this._spherical.radius,
        this._sphericalEnd.radius,
        this.restThreshold
      )
    return this._createOnRestPromise(resolveImmediately)
  }

  update(delta) {
    this._hasRestedLastFrame = this._hasRested
    const dampingFactor =
      this._state === ACTION.NONE ? this.dampingFactor : this.draggingDampingFactor
    const lerpRatio = Math.min(dampingFactor * delta * 60, 1)
    const deltaTheta = this._sphericalEnd.theta - this._spherical.theta
    const deltaPhi = this._sphericalEnd.phi - this._spherical.phi
    const deltaRadius = this._sphericalEnd.radius - this._spherical.radius
    const deltaTarget = _deltaTarget.subVectors(this._targetEnd, this._target)
    const deltaOffset = _deltaOffset.subVectors(this._focalOffsetEnd, this._focalOffset)
    if (
      !approxZero(deltaTheta) ||
      !approxZero(deltaPhi) ||
      !approxZero(deltaRadius) ||
      !approxZero(deltaTarget.x) ||
      !approxZero(deltaTarget.y) ||
      !approxZero(deltaTarget.z) ||
      !approxZero(deltaOffset.x) ||
      !approxZero(deltaOffset.y) ||
      !approxZero(deltaOffset.z)
    ) {
      this._spherical.set(
        this._spherical.radius +
          deltaRadius *
            (this.overrideDollyLerpRatio ? this.overrideDollyLerpRatio : lerpRatio),
        this._spherical.phi + deltaPhi * lerpRatio,
        this._spherical.theta + deltaTheta * lerpRatio
      )
      this._target.add(deltaTarget.multiplyScalar(lerpRatio))
      this._focalOffset.add(deltaOffset.multiplyScalar(lerpRatio))
      this._needsUpdate = true
    } else {
      this._spherical.copy(this._sphericalEnd)
      this._target.copy(this._targetEnd)
      this._focalOffset.copy(this._focalOffsetEnd)
    }
    if (this._dollyControlAmount !== 0) {
      if (isPerspectiveCamera(this._camera)) {
        const camera = this._camera
        const direction = _v3A
          .setFromSpherical(this._sphericalEnd)
          .applyQuaternion(this._yAxisUpSpaceInverse)
          .normalize()
          .negate()
        const planeX = _v3B.copy(direction).cross(camera.up).normalize()
        if (planeX.lengthSq() === 0) planeX.x = 1.0
        const planeY = _v3C.crossVectors(planeX, direction)
        const worldToScreen =
          this._sphericalEnd.radius *
          Math.tan(
            (camera as PerspectiveCamera).getEffectiveFOV() * MathUtils.DEG2RAD * 0.5
          )
        const prevRadius = this._sphericalEnd.radius - this._dollyControlAmount
        const lerpRatio =
          (prevRadius - this._sphericalEnd.radius) / this._sphericalEnd.radius
        const cursor = _v3A
          .copy(this._targetEnd)
          .add(
            planeX.multiplyScalar(
              this._dollyControlCoord.x *
                worldToScreen *
                (camera as PerspectiveCamera).aspect
            )
          )
          .add(planeY.multiplyScalar(this._dollyControlCoord.y * worldToScreen))
        this._targetEnd.lerp(cursor, lerpRatio)
        this._target.copy(this._targetEnd)
      } else if (isOrthographicCamera(this._camera)) {
        const camera = this._camera
        const worldPosition = _v3A
          .set(
            this._dollyControlCoord.x,
            this._dollyControlCoord.y,
            (camera.near + camera.far) / (camera.near - camera.far)
          )
          .unproject(camera)
        const quaternion = _v3B.set(0, 0, -1).applyQuaternion(camera.quaternion)
        const divisor = quaternion.dot(camera.up)
        const distance = approxZero(divisor)
          ? -worldPosition.dot(camera.up)
          : -worldPosition.dot(camera.up) / divisor
        const cursor = _v3C.copy(worldPosition).add(quaternion.multiplyScalar(distance))
        this._targetEnd.lerp(cursor, 1 - camera.zoom / this._dollyControlAmount)
        this._target.copy(this._targetEnd)
      }
      this._dollyControlAmount = 0
    }
    const maxDistance = this._collisionTest()
    this._spherical.radius = Math.min(this._spherical.radius, maxDistance)
    this._spherical.makeSafe()
    this._camera.position
      .setFromSpherical(this._spherical)
      .applyQuaternion(this._yAxisUpSpaceInverse)
      .add(this._target)
    this._camera.lookAt(this._target)
    const affectOffset =
      !approxZero(this._focalOffset.x) ||
      !approxZero(this._focalOffset.y) ||
      !approxZero(this._focalOffset.z)
    if (affectOffset) {
      this._camera.updateMatrix()
      _xColumn.setFromMatrixColumn(this._camera.matrix, 0)
      _yColumn.setFromMatrixColumn(this._camera.matrix, 1)
      _zColumn.setFromMatrixColumn(this._camera.matrix, 2)
      _xColumn.multiplyScalar(this._focalOffset.x)
      _yColumn.multiplyScalar(-this._focalOffset.y)
      _zColumn.multiplyScalar(this._focalOffset.z)
      _v3A.copy(_xColumn).add(_yColumn).add(_zColumn)
      this._camera.position.add(_v3A)
    }
    if (this._boundaryEnclosesCamera) {
      this._encloseToBoundary(
        this._camera.position.copy(this._target),
        _v3A
          .setFromSpherical(this._spherical)
          .applyQuaternion(this._yAxisUpSpaceInverse),
        1.0
      )
    }
    const zoomDelta = this._zoomEnd - this._zoom
    this._zoom +=
      zoomDelta * (this.overrideZoomLerpRatio ? this.overrideZoomLerpRatio : lerpRatio)
    if (this._camera.zoom !== this._zoom) {
      if (approxZero(zoomDelta)) {
        this._zoom = this._zoomEnd
      }
      this._camera.zoom = this._zoom
      this._camera.updateProjectionMatrix()
      this._updateNearPlaneCorners()
      this._needsUpdate = true
      this._didZoom = true
    } else {
      this._didZoom = false
    }
    const updated = this._needsUpdate
    if (updated && !this._updatedLastTime) {
      this._hasRested = false
      this.dispatchEvent({ type: 'wake' })
      this.dispatchEvent({ type: 'update' })
    } else if (updated) {
      this.dispatchEvent({ type: 'update' })
      if (
        approxZero(deltaTheta, this.restThreshold) &&
        approxZero(deltaPhi, this.restThreshold) &&
        approxZero(deltaRadius, this.restThreshold) &&
        approxZero(deltaTarget.x, this.restThreshold) &&
        approxZero(deltaTarget.y, this.restThreshold) &&
        approxZero(deltaTarget.z, this.restThreshold) &&
        approxZero(deltaOffset.x, this.restThreshold) &&
        approxZero(deltaOffset.y, this.restThreshold) &&
        approxZero(deltaOffset.z, this.restThreshold) &&
        !this._hasRested &&
        !this._isTrucking &&
        (isOrthographicCamera(this._camera) ? !this._didZoom : true)
      ) {
        this._hasRested = true
        this.dispatchEvent({ type: 'rest' })
      }
    } else if (!updated && this._updatedLastTime) {
      this.dispatchEvent({ type: 'sleep' })
    }
    if (this._didDollyLastFrame) {
      if (
        approxZero(deltaTheta, this.restThreshold) &&
        approxZero(deltaPhi, this.restThreshold) &&
        approxZero(deltaRadius, this.restThreshold) &&
        approxZero(deltaTarget.x, this.restThreshold) &&
        approxZero(deltaTarget.y, this.restThreshold) &&
        approxZero(deltaTarget.z, this.restThreshold) &&
        approxZero(deltaOffset.x, this.restThreshold) &&
        approxZero(deltaOffset.y, this.restThreshold) &&
        approxZero(deltaOffset.z, this.restThreshold) &&
        !this._isTrucking &&
        (isOrthographicCamera(this._camera) ? !this._didZoom : true)
      ) {
        this.dispatchEvent({ type: 'rest' })
        this._didDollyLastFrame = false
      }
    }

    if (this._didDolly) {
      this._didDolly = false
      this._didDollyLastFrame = true
    }

    this._updatedLastTime = updated
    this._needsUpdate = false
    return updated && !this._hasRested
  }
}
