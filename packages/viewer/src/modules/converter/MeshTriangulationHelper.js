/* eslint-disable camelcase */
import { Triangle, Vector3 } from 'three'

/**
 * Set of functions to triangulate n-gon faces (i.e. polygon faces with an arbitrary (n) number of vertices).
 * This class is a JavaScript port of https://github.com/specklesystems/speckle-sharp/blob/main/Objects/Objects/Utils/MeshTriangulationHelper.cs
 */
const _vec30 = new Vector3()
const _vec31 = new Vector3()
const _vec32 = new Vector3()
const _vec33 = new Vector3()
const _normal = new Vector3()
const _triangle = new Triangle()

export default class MeshTriangulationHelper {
  /**
   * Calculates the triangulation of the face at given faceIndex.
   * @remarks This implementation is based the ear clipping method proposed by "Christer Ericson (2005) <i>Real-Time Collision Detection</i>.
   * @param {Number}   faceIndex      The index of the face's cardinality indicator `n`
   * @param {Number[]}   faces      The list of faces in the mesh
   * @param {Number[]}   vertices   The list of vertices in the mesh
   * @return {Number} flat list of triangle faces (without cardinality indicators)
   */
  static triangulateFace(
    faceIndex,
    faces,
    vertices,
    /** Purists rolling over in their graves because of this */
    _inout_targetArray,
    _in_offset
  ) {
    let n = faces.get(faceIndex)
    if (n < 3) n += 3 // 0 -> 3, 1 -> 4

    //Converts from relative to absolute index (returns index in mesh.vertices list)
    /** Why doesn't javascript have a means to inline functions?! */
    function asIndex(v) {
      return faceIndex + v + 1
    }

    //Gets vertex from a relative vert index
    function V(v, target) {
      const index = faces.get(asIndex(v)) * 3
      target.x = vertices.get(index)
      target.y = vertices.get(index + 1)
      target.z = vertices.get(index + 2)
      return target
    }

    //Calculate face normal using the Newell Method
    const faceNormal = _normal
    for (let ii = n - 1, jj = 0; jj < n; ii = jj, jj++) {
      const iPos = V(ii, _vec30)
      const jPos = V(jj, _vec31)
      faceNormal.x += (jPos.y - iPos.y) * (iPos.z + jPos.z) // projection on yz
      faceNormal.y += (jPos.z - iPos.z) * (iPos.x + jPos.x) // projection on xz
      faceNormal.z += (jPos.x - iPos.x) * (iPos.y + jPos.y) // projection on xy
    }
    faceNormal.normalize()

    //Set up previous and next links to effectively form a double-linked vertex list
    const prev = [] //new Array(n)
    const next = [] //new Array(n)
    for (let j = 0; j < n; j++) {
      prev[j] = j - 1
      next[j] = j + 1
    }
    prev[0] = n - 1
    next[n - 1] = 0

    //Start clipping ears until we are left with a triangle
    let i = 0
    let counter = 0
    let localOffset = 0
    while (n >= 3) {
      let isEar = true

      //If we are the last triangle or we have exhausted our vertices, the below statement will be false
      if (n > 3 && counter < n) {
        const prevVertex = V(prev[i], _vec30)
        const earVertex = V(i, _vec31)
        const nextVertex = V(next[i], _vec32)

        _triangle.a.copy(prevVertex)
        _triangle.b.copy(earVertex)
        _triangle.c.copy(nextVertex)

        if (_triangle.isFrontFacing(faceNormal)) {
          let k = next[next[i]]

          do {
            if (_triangle.containsPoint(V(k, _vec33))) {
              isEar = false
              break
            }

            k = next[k]
          } while (k !== prev[i])
        } else {
          isEar = false
        }
      }

      if (isEar) {
        const a = faces.get(asIndex(i))
        const b = faces.get(asIndex(next[i]))
        const c = faces.get(asIndex(prev[i]))
        _inout_targetArray[_in_offset + localOffset] = a
        _inout_targetArray[_in_offset + localOffset + 1] = b
        _inout_targetArray[_in_offset + localOffset + 2] = c
        localOffset += 3

        next[prev[i]] = next[i]
        prev[next[i]] = prev[i]
        n--
        i = prev[i]
        counter = 0
      } else {
        i = next[i]
        counter++
      }
    }

    return localOffset
  }
}
