import { Mesh, ShapeGeometry } from 'three'
import defaultFont from '../../assets/defaultFont.png'
import { Assets } from '../Assets'
import { Font } from 'three/examples/jsm/loaders/FontLoader'

export class SpeckleText extends Mesh {
  private static font: Font = null

  public static async init() {
    SpeckleText.font = await Assets.getFont(defaultFont)
  }

  public setText(text: string, size: number) {
    const shapes = SpeckleText.font.generateShapes(text, size)
    const geometry = new ShapeGeometry(shapes)
    geometry.computeBoundingBox()
    const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x)
    geometry.translate(xMid, 0, 0)
    this.geometry = geometry
  }
}
