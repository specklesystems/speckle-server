import { Mesh } from 'three'
import { Text } from 'troika-three-text'
import { SpeckleObject } from '../tree/DataTree'

export interface SpeckleTextParams {
  textValue?: string
  richTextValue?: string
  height?: number
}

export class SpeckleText extends Mesh {
  private _text: Text = null
  private _background: Mesh = null

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

  public constructor(uuid: string) {
    super()
    this._text = new Text()
    this._text.uuid = uuid
    this._text.depthOffset = -0.01
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

      this._text.sync(() => {
        resolve()
        if (updateFinished) updateFinished()
      })
    })
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

  // private setBackground() {
  //   this.text.geometry.computeBoundingBox()
  //   const sizeBox = this.text.geometry.boundingBox.getSize(new Vector3())
  //   const geometry = new PlaneGeometry(sizeBox.x, sizeBox.y)
  //   const material = new SpeckleBasicMaterial({ color: 0xff0000 }, ['USE_RTE'])
  //   material.toneMapped = false
  //   this.background = new Mesh(geometry, material)
  //   this.background.layers.set(ObjectLayers.PROPS)
  //   this.background.frustumCulled = false
  //   this.background.renderOrder = 1
  // }

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
