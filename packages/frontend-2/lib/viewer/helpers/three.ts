import { round } from 'lodash-es'
import { Vector3 } from 'three'

export function areVectorsLooselyEqual(v1: Vector3, v2: Vector3, precision = 6) {
  const v1Dimensions = v1.toArray()
  const v2Dimensions = v2.toArray()

  for (let i = 0; i < v1Dimensions.length; i++) {
    const v1Dimension = round(v1Dimensions[i], precision)
    const v2Dimension = round(v2Dimensions[i], precision)
    if (v1Dimension !== v2Dimension) return false
  }

  return true
}
