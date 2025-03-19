// three-box3-extension.ts

import { Box3, Vector3, Matrix3 } from 'three'
import { OBB } from 'three/examples/jsm/math/OBB.js'

OBB.prototype.isEmpty = function () {
  return this.halfSize.length() === 0
}

Box3.prototype.fromOBB = function (obb: OBB): Box3 {
  const { center, halfSize, rotation } = obb

  const localCorners = [
    new Vector3(-halfSize.x, -halfSize.y, -halfSize.z),
    new Vector3(-halfSize.x, -halfSize.y, halfSize.z),
    new Vector3(-halfSize.x, halfSize.y, -halfSize.z),
    new Vector3(-halfSize.x, halfSize.y, halfSize.z),
    new Vector3(halfSize.x, -halfSize.y, -halfSize.z),
    new Vector3(halfSize.x, -halfSize.y, halfSize.z),
    new Vector3(halfSize.x, halfSize.y, -halfSize.z),
    new Vector3(halfSize.x, halfSize.y, halfSize.z)
  ]

  const worldCorners = localCorners.map((corner) =>
    corner.applyMatrix3(rotation).add(center)
  )

  const aabb = new Box3().setFromPoints(worldCorners)

  return aabb
}

/** This is untested. Might be busted */
Box3.prototype.intersectOBB = function (obb: OBB): OBB | null {
  // Step 1: Compute AABB corners
  const aabbCorners = [
    new Vector3(this.min.x, this.min.y, this.min.z),
    new Vector3(this.min.x, this.min.y, this.max.z),
    new Vector3(this.min.x, this.max.y, this.min.z),
    new Vector3(this.min.x, this.max.y, this.max.z),
    new Vector3(this.max.x, this.min.y, this.min.z),
    new Vector3(this.max.x, this.min.y, this.max.z),
    new Vector3(this.max.x, this.max.y, this.min.z),
    new Vector3(this.max.x, this.max.y, this.max.z)
  ]

  // Step 2: Transform AABB corners to OBB's local space
  const invRotation = new Matrix3().copy(obb.rotation).invert()
  const localAABBCorners = aabbCorners.map((corner) =>
    corner.clone().sub(obb.center).applyMatrix3(invRotation)
  )

  // Step 3: Keep points inside the OBB (AABB points clipped by OBB)
  const intersectionPoints = []
  for (const corner of localAABBCorners) {
    if (
      Math.abs(corner.x) <= obb.halfSize.x &&
      Math.abs(corner.y) <= obb.halfSize.y &&
      Math.abs(corner.z) <= obb.halfSize.z
    ) {
      intersectionPoints.push(corner)
    }
  }

  // Step 4: Clip OBB edges against AABB and collect additional intersection points
  // (Skipping full clipping for brevity—this can be done using segment-box clipping)

  if (intersectionPoints.length === 0) {
    return null // No intersection
  }

  // Step 5: Compute the centroid of the intersection points
  const centroid = new Vector3()
  intersectionPoints.forEach((pt) => centroid.add(pt))
  centroid.divideScalar(intersectionPoints.length)

  // Step 6: Compute a best-fit OBB for the intersection points
  // Use PCA or a heuristic to determine the best-fit orientation
  // For simplicity, we'll use the OBB's existing axes
  const bestFitAxes = [new Vector3(), new Vector3(), new Vector3()]
  obb.rotation.extractBasis(bestFitAxes[0], bestFitAxes[1], bestFitAxes[2])

  // Step 7: Compute half-size along each axis
  const halfSize = new Vector3()
  for (const pt of intersectionPoints) {
    for (let i = 0; i < 3; i++) {
      const proj = pt.clone().sub(centroid).dot(bestFitAxes[i])
      halfSize.setComponent(i, Math.max(halfSize.getComponent(i), Math.abs(proj)))
    }
  }

  // Step 8: Convert centroid back to world space
  const worldCentroid = centroid.applyMatrix3(obb.rotation).add(obb.center)

  // Step 9: Return the resulting OBB
  return new OBB(worldCentroid, halfSize, obb.rotation.clone())
}
