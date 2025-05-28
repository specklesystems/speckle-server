import { Box3, Matrix4, Vector2, Vector3 } from 'three'
import { DEG2RAD } from 'three/src/math/MathUtils.js'

const MatBuff0: Matrix4 = new Matrix4()
const BoxBuff0: Box3 = new Box3()
const BoxBuff1: Box3 = new Box3()
const VecBuff: Vector3 = new Vector3()

export function getRelativeOffset(
  referenceBox: Box3,
  offsetAmount: number = 0.001
): number {
  if (referenceBox.isEmpty()) return offsetAmount

  MatBuff0.identity()
  MatBuff0.makeScale(1 + offsetAmount, 1 + offsetAmount, 1 + offsetAmount)
  const worldSize = referenceBox.getSize(VecBuff).multiplyScalar(0.5)

  BoxBuff0.min.set(0, 0, 0)
  BoxBuff0.max.set(0, 0, 0)
  BoxBuff1.min.set(0, 0, 0)
  BoxBuff1.max.set(0, 0, 0)
  const sizeBox = BoxBuff0.expandByVector(worldSize)
  const offsetBox = BoxBuff1.copy(sizeBox).applyMatrix4(MatBuff0)
  const dist = offsetBox.max.distanceTo(sizeBox.max)
  return dist
}

export function makePerspectiveProjection(
  screenSize: Vector2,
  fov: number,
  near: number,
  far: number
) {
  const aspect = screenSize.x / screenSize.y
  const top = near * Math.tan(DEG2RAD * 0.5 * fov)
  const height = 2 * top
  const width = aspect * height
  const left = -0.5 * width

  return new Matrix4().makePerspective(left, left + width, top, top - height, near, far)
}
