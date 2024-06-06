import {
  OrthographicCamera,
  PerspectiveCamera,
  Sphere,
  Spherical,
  Vector3
} from 'three'
import EventEmitter from '../../EventEmitter'

export abstract class SpeckleControls extends EventEmitter {
  abstract get enabled(): boolean
  abstract set enabled(value: boolean)
  abstract set controlTarget(target: PerspectiveCamera | OrthographicCamera)

  abstract isStationary(): boolean
  abstract update(delta?: number): boolean
  abstract jumpToGoal(): void
  abstract fitToSphere(sphere: Sphere): void
  abstract dispose(): void

  abstract fromPositionAndTarget(position: Vector3, target: Vector3): void
  abstract fromSpherical(spherical: Spherical, origin?: Vector3): void
  abstract getTarget(): Vector3
  abstract getPosition(): Vector3
}
