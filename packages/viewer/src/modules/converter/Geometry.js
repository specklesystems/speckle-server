import { BufferGeometry } from 'three'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'

export const GEOMETRY_LINES_AS_TRIANGLES = true
export const GEOMETRY_POSITION_ATTRIBUTE = 'position'
export const GEOMETRY_COLOR_ATTRIBUTE = 'color'

export class Geometry {
  static makeLineGeometry(attributes, flat) {
    if (GEOMETRY_LINES_AS_TRIANGLES) {
      return this.makeLineGeometry_TRIANGLE(attributes, flat)
    } else {
      return this.makeLineGeometry_LINE(attributes)
    }
  }

  static makeLineGeometry_LINE(attributes) {
    return new BufferGeometry().setFromPoints(attributes[GEOMETRY_POSITION_ATTRIBUTE])
  }

  static makeLineGeometry_TRIANGLE(attributes, flat = false) {
    const geometry = new LineGeometry()
    geometry.setPositions(
      (() => {
        if (flat) {
          return attributes[GEOMETRY_POSITION_ATTRIBUTE]
        }
        const points = attributes[GEOMETRY_POSITION_ATTRIBUTE]
        const out = []
        for (var k = 0; k < points.length; k++) {
          out.push(points[k].x, points[k].y, points[k].z ? points[k].z : 0)
        }
        return out
      })()
    )
    if (attributes[GEOMETRY_COLOR_ATTRIBUTE])
      geometry.setColors(attributes[GEOMETRY_COLOR_ATTRIBUTE])
    return geometry
  }
}
