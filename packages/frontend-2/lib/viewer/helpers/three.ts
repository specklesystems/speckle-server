import { round } from 'lodash-es'
import type { Vector3 } from 'three'

export function areVectorsLooselyEqual(v1: Vector3, v2: Vector3, precision = 6) {
  const coords1 = v1.toArray()
  const coords2 = v2.toArray()

  for (let i = 0; i < coords1.length; i++) {
    const rounded1 = round(coords1[i], precision)
    const rounded2 = round(coords2[i], precision)
    if (rounded1 !== rounded2) return false
  }

  return true
}
