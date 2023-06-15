import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Mesh,
  Quaternion,
  Vector3
} from 'three'
import { Text } from 'troika-three-text'
import { SpeckleObject } from '../tree/DataTree'
import SpeckleBasicMaterial from '../materials/SpeckleBasicMaterial'
import { ObjectLayers } from '../SpeckleRenderer'

export interface SpeckleTextParams {
  textValue?: string
  richTextValue?: string
  height?: number
}

export interface SpeckleTextStyle {
  backgroundColor?: Color
  backgroundCornerRadius?: number
  textColor?: Color
  billboard?: boolean
  anchorX?: string
  anchorY?: string
}

const DefaultSpeckleTextStyle: SpeckleTextStyle = {
  backgroundColor: null,
  backgroundCornerRadius: 1,
  textColor: new Color(0xffffff),
  billboard: false,
  anchorX: '50%',
  anchorY: '50%'
}

export class SpeckleText extends Mesh {
  private _text: Text = null
  private _background: Mesh = null
  private _style: SpeckleTextStyle = Object.assign({}, DefaultSpeckleTextStyle)

  public static SpeckleTextParamsFromMetadata(metadata: SpeckleObject) {
    return {
      textValue: metadata.value ? metadata.value : 'N/A',
      height: metadata.height
    } as SpeckleTextParams
  }

  public get textMesh() {
    return this._text
  }

  public get backgroundMesh() {
    return this._background
  }

  public set style(value: SpeckleTextStyle) {
    Object.assign(this._style, value)
    this.updateStyle()
  }

  public constructor(uuid: string) {
    super()
    this._text = new Text()
    this._text.uuid = uuid
    this._text.depthOffset = -0.1
    this.add(this._text)
  }

  // public async build() {
  //   this._text = new Text()
  //   this._text.text = text
  //   this.text.fontSize = size
  //   this.text.color = 0xffffff
  //   const material = new SpeckleBasicMaterial({ color: 0xff0000 }, ['USE_RTE'])
  //   // material.side = DoubleSide
  //   this.text.frustumCulled = false
  //   this.text.layers.set(ObjectLayers.PROPS)
  //   this.text.material = createTextDerivedMaterial(material)
  //   this.text.material.uniforms['billboardPos'] = material.userData.billboardPos
  //   this.text.material.toneMapped = false
  //   await this.update()
  // }

  public async update(params: SpeckleTextParams, updateFinished?: () => void) {
    return new Promise<void>((resolve) => {
      if (params.textValue) {
        this._text.text = params.textValue
      }
      if (params.richTextValue) {
        //TO DO
      }
      if (params.height) {
        this._text.fontSize = params.height
      }
      this._text.anchorX = this._style.anchorX
      this._text.anchorY = this._style.anchorY

      this._text.sync(() => {
        resolve()
        if (updateFinished) updateFinished()
      })
    })
  }

  public setTransform(position: Vector3, quaternion: Quaternion, scale: Vector3) {
    if (this._style.billboard) {
      this.textMesh.material.userData.billboardPos.value.copy(position)
      ;(
        this._background.material as SpeckleBasicMaterial
      ).userData.billboardPos.value.copy(position)
    }

    if (position) this.position.copy(position)
    if (quaternion) this.quaternion.copy(quaternion)
    if (scale) this.scale.copy(scale)
  }

  private updateStyle() {
    this.updateBackground()
  }
  // public get vertCount() {
  //   return this.text.geometry.attributes.position.count
  // }

  // public get triCount() {
  //   return this.text.geometry.index.count
  // }

  // public async setText(text: string, size: number) {
  //   return new Promise<void>((resolve) => {
  //     this.text = new Text()
  //     this.text.text = text
  //     this.text.fontSize = size
  //     this.text.color = 0xffffff
  //     const material = new SpeckleBasicMaterial({ color: 0xff0000 }, ['USE_RTE'])
  //     // material.side = DoubleSide
  //     this.text.frustumCulled = false
  //     this.text.layers.set(ObjectLayers.PROPS)
  //     this.text.material = createTextDerivedMaterial(material)
  //     this.text.material.uniforms['billboardPos'] = material.userData.billboardPos
  //     this.text.material.toneMapped = false
  //     this.text.sync(() => {
  //       this.setBackground()
  //       resolve()
  //     })
  //   })
  // }

  private updateBackground() {
    if (!this._style.backgroundColor) {
      this.remove(this._background)
      this._background = null
      return
    }

    if (this._background === null) {
      this._text.geometry.computeBoundingBox()
      const sizeBox = this._text.geometry.boundingBox.getSize(new Vector3())

      const geometry = this.RectangleRounded(sizeBox.x * 1.2, sizeBox.y * 1.2, 0.5, 5)

      const material = new SpeckleBasicMaterial({}, ['BILLBOARD_FIXED'])
      material.toneMapped = false
      material.side = DoubleSide
      material.depthTest = false
      material.billboardPixelHeight = 20
      this._background = new Mesh(geometry, material)
      this._background.layers.set(ObjectLayers.MEASUREMENTS)
      this._background.frustumCulled = false
      this._background.renderOrder = 1
      this.add(this._background)
    }
    const color = new Color(this._style.backgroundColor).convertSRGBToLinear()
    ;(this._background.material as SpeckleBasicMaterial).color = color
  }

  /** From https://discourse.threejs.org/t/roundedrectangle-squircle/28645  */
  // width, height, radiusCorner, smoothness
  private RectangleRounded(w: number, h: number, r: number, s: number) {
    // width, height, radiusCorner, smoothness

    const pi2 = Math.PI * 2
    const n = (s + 1) * 4 // number of segments
    const indices = []
    const positions = []
    const uvs = []
    let qu, sgx, sgy, x, y

    for (let j = 1; j < n + 1; j++) indices.push(0, j, j + 1) // 0 is center
    indices.push(0, n, 1)
    positions.push(0, 0, 0) // rectangle center
    uvs.push(0.5, 0.5)
    for (let j = 0; j < n; j++) contour(j)

    const geometry = new BufferGeometry()
    geometry.setIndex(new BufferAttribute(new Uint32Array(indices), 1))
    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(positions), 3)
    )
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2))

    return geometry

    function contour(j) {
      qu = Math.trunc((4 * j) / n) + 1 // quadrant  qu: 1..4
      sgx = qu === 1 || qu === 4 ? 1 : -1 // signum left/right
      sgy = qu < 3 ? 1 : -1 // signum  top / bottom
      x = sgx * (w / 2 - r) + r * Math.cos((pi2 * (j - qu + 1)) / (n - 4)) // corner center + circle
      y = sgy * (h / 2 - r) + r * Math.sin((pi2 * (j - qu + 1)) / (n - 4))

      positions.push(x, y, 0)
      uvs.push(0.5 + x / w, 0.5 + y / h)
    }
  }

  // public transform(matrix: Matrix4) {
  //   this.geometry.applyMatrix4(matrix)
  //   this.geometry.computeBoundingBox()
  //   const center = this.geometry.boundingBox.getCenter(new Vector3())
  //   ;(this.material as SpeckleBasicMaterial).userData.billboardPos.value = new Vector3(
  //     center.x,
  //     center.y,
  //     center.z
  //   )
  //   ;(this.material as SpeckleBasicMaterial).needsUpdate = true
  // }

  // public setPosition(pos: Vector3) {
  //   // this.text.position.copy(pos)
  //   const mat = this.text.material
  //   ;(mat as SpeckleBasicMaterial).userData.billboardPos.value = pos
  //   ;(mat as SpeckleBasicMaterial).needsUpdate = true

  //   const backgroundPos = new Vector3().copy(pos)
  //   // backgroundPos.x += sizeBox.x * 0.5
  //   // backgroundPos.y += sizeBox.y * 0.5
  //   ;(this.background.material as SpeckleBasicMaterial).userData.billboardPos.value =
  //     backgroundPos
  //   ;(this.background.material as SpeckleBasicMaterial).needsUpdate = true
  //   this.text.anchorX = '50%'
  //   this.text.anchorY = '50%'
  //   this.text.sync()
  // }
}
