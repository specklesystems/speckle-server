import { Matrix4, Mesh, PlaneGeometry, Vector3 } from 'three'
import defaultFont from '../../assets/defaultFont.png'
import { Assets } from '../Assets'
import { Font } from 'three/examples/jsm/loaders/FontLoader'
import SpeckleBasicMaterial from '../materials/SpeckleBasicMaterial'
import { Text, createTextDerivedMaterial } from 'troika-three-text'
import { ObjectLayers } from '../SpeckleRenderer'

export class SpeckleText extends Mesh {
  private static font: Font = null
  public text: Text = null
  public background: Mesh = null

  public static async init() {
    SpeckleText.font = await Assets.getFont(defaultFont)
  }

  public get vertCount() {
    return this.text.geometry.attributes.position.count
  }

  public get triCount() {
    return this.text.geometry.index.count
  }

  public async setText(text: string, size: number) {
    // const shapes = SpeckleText.font.generateShapes(text, size)
    // const geometry = new ShapeGeometry(shapes)
    // // geometry.rotateX(Math.PI * 0.5)
    // geometry.computeBoundingBox()
    // // const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x)
    // // geometry.translate(xMid, 0, 0)
    // this.geometry = geometry
    // this.material = new SpeckleBasicMaterial({ color: 0xff0000 }, ['USE_RTE'])
    // this.material.side = DoubleSide
    // this.frustumCulled = false
    return new Promise<void>((resolve) => {
      this.text = new Text()
      this.text.text = text
      this.text.fontSize = size
      this.text.color = 0xffffff
      const material = new SpeckleBasicMaterial({ color: 0xff0000 }, ['USE_RTE'])
      // material.side = DoubleSide
      this.text.frustumCulled = false
      this.text.layers.set(ObjectLayers.PROPS)
      this.text.material = createTextDerivedMaterial(material)
      this.text.material.uniforms['billboardPos'] = material.userData.billboardPos
      this.text.material.toneMapped = false
      this.text.sync(() => {
        this.setBackground()
        resolve()
      })
    })
  }

  private setBackground() {
    this.text.geometry.computeBoundingBox()
    const sizeBox = this.text.geometry.boundingBox.getSize(new Vector3())
    const geometry = new PlaneGeometry(sizeBox.x, sizeBox.y)
    const material = new SpeckleBasicMaterial({ color: 0xff0000 }, ['USE_RTE'])
    material.toneMapped = false
    this.background = new Mesh(geometry, material)
    this.background.layers.set(ObjectLayers.PROPS)
    this.background.frustumCulled = false
    this.background.renderOrder = 1
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

  public setPosition(pos: Vector3) {
    // this.text.position.copy(pos)
    const mat = this.text.material
    ;(mat as SpeckleBasicMaterial).userData.billboardPos.value = pos
    ;(mat as SpeckleBasicMaterial).needsUpdate = true

    const backgroundPos = new Vector3().copy(pos)
    // backgroundPos.x += sizeBox.x * 0.5
    // backgroundPos.y += sizeBox.y * 0.5
    ;(this.background.material as SpeckleBasicMaterial).userData.billboardPos.value =
      backgroundPos
    ;(this.background.material as SpeckleBasicMaterial).needsUpdate = true
    this.text.anchorX = '50%'
    this.text.anchorY = '50%'
    this.text.sync()
  }
}
