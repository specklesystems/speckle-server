import { BufferGeometry } from 'three'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'

export const GEOMETRY_LINES_AS_TRIANGLES = true
export const GEOMETRY_POSITION_ATTRIBUTE = 'position'
export const GEOMETRY_COLOR_ATTRIBUTE = 'color'

export class Geometry {
  static makeLineGeometry(attributes) {
    if (GEOMETRY_LINES_AS_TRIANGLES) {
      return this.makeLineGeometry_TRIANGLE(attributes)
    } else {
      return this.makeLineGeometry_LINE(attributes)
    }
  }

  static makeLineGeometry_LINE(attributes) {
    return new BufferGeometry().setFromPoints(attributes[GEOMETRY_POSITION_ATTRIBUTE])
  }

  static makeLineGeometry_TRIANGLE(attributes) {
    const geometry = new LineGeometry()
    geometry.setPositions(attributes[GEOMETRY_POSITION_ATTRIBUTE])
    if (attributes[GEOMETRY_COLOR_ATTRIBUTE])
      geometry.setColors(attributes[GEOMETRY_COLOR_ATTRIBUTE])
    return geometry
  }
}
