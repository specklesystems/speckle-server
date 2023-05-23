import { Matrix4, Mesh, ShapeGeometry, Vector3 } from 'three'
import defaultFont from '../../assets/defaultFont.png'
import { Assets } from '../Assets'
import { Font } from 'three/examples/jsm/loaders/FontLoader'
import SpeckleBasicMaterial from '../materials/SpeckleBasicMaterial'

export class SpeckleText extends Mesh {
  private static font: Font = null

  public static async init() {
    SpeckleText.font = await Assets.getFont(defaultFont)
  }

  public get vertCount() {
    return this.geometry.attributes.position.count
  }

  public get triCount() {
    return this.geometry.index.count
  }

  public setText(text: string, size: number) {
    const shapes = SpeckleText.font.generateShapes(text, size)
    const geometry = new ShapeGeometry(shapes)
    geometry.computeBoundingBox()
    const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x)
    geometry.translate(xMid, 0, 0)
    this.geometry = geometry
    this.material = new SpeckleBasicMaterial({ color: 0xff0000 }, ['USE_RTE'])
  }

  public transform(matrix: Matrix4) {
    this.geometry.applyMatrix4(matrix)
    this.geometry.computeBoundingBox()
    const center = this.geometry.boundingBox.getCenter(new Vector3())
    ;(this.material as SpeckleBasicMaterial).userData.billboardPos.value = new Vector3(
      center.x,
      center.y,
      center.z
    )
    ;(this.material as SpeckleBasicMaterial).needsUpdate = true
  }
}
