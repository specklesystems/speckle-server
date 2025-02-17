import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  Raycaster,
  Vector2,
  Vector3,
  Vector4,
  type Intersection
} from 'three'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import { Text } from 'troika-three-text'
import SpeckleBasicMaterial from '../materials/SpeckleBasicMaterial.js'
import { ObjectLayers, type SpeckleObject } from '../../IViewer.js'

export interface SpeckleTextParams {
  textValue?: string
  richTextValue?: string
  height?: number
  anchorX?: string
  anchorY?: string
}

export interface SpeckleTextStyle {
  backgroundColor?: Color | null
  backgroundCornerRadius?: number
  backgroundPixelHeight?: number
  textColor?: Color
  billboard?: boolean
}

const DefaultSpeckleTextStyle: SpeckleTextStyle = {
  backgroundColor: null,
  backgroundCornerRadius: 1,
  backgroundPixelHeight: 50,
  textColor: new Color(0xffffff),
  billboard: false
}

export class SpeckleText extends Mesh {
  private _layer: ObjectLayers = ObjectLayers.NONE
  private _text: Text = null
  private _background: Mesh | null = null
  private _backgroundSize: Vector3 = new Vector3()
  private _style: SpeckleTextStyle = Object.assign({}, DefaultSpeckleTextStyle)
  private _resolution: Vector2 = new Vector2()

  private defaultMaterial = /*#__PURE__*/ new MeshBasicMaterial({
    color: 0xffffff,
    side: DoubleSide,
    transparent: true
  })
  private getFlatRaycastMesh = () => {
    const mesh = new Mesh(new PlaneGeometry(1, 1), this.defaultMaterial)
    this.getFlatRaycastMesh = () => mesh
    return mesh
  }
  private getCurvedRaycastMesh = () => {
    const mesh = new Mesh(new PlaneGeometry(1, 1, 32, 1), this.defaultMaterial)
    this.getCurvedRaycastMesh = () => mesh
    return mesh
  }

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

  public constructor(uuid: string, layer: ObjectLayers) {
    super()
    this.uuid = uuid
    this._layer = layer
    this._text = new Text()
    this._text.depthOffset = -0.1
    this._text.raycast = () => {
      /** We're erasing the child's raycast so we don't raycast twice
       * Not the best approach but until we figure out text batching it will have to suffice
       */
    }
    this.layers.set(this._layer)
    this._text.layers.set(this._layer)
    this.add(this._text)

    this.onBeforeRender = (renderer) => {
      renderer.getDrawingBufferSize(this._resolution)
    }
    /** Otherwise three.js is inconsistent in calling our 'onBeforeRender' */
    this.frustumCulled = false
  }

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
      this._text.anchorX = params.anchorX
      this._text.anchorY = params.anchorY
      if (this._text._needsSync) {
        this._text.sync(() => {
          resolve()
          if (updateFinished) updateFinished()
        })
      } else {
        resolve()
        if (updateFinished) updateFinished()
      }
    })
  }

  public setTransform(position?: Vector3, quaternion?: Quaternion, scale?: Vector3) {
    if (position) {
      if (this._style.billboard) {
        this.textMesh.material.userData.billboardPos.value.copy(position)
        if (this._background) {
          ;(
            this._background.material as SpeckleBasicMaterial
          ).userData.billboardPos.value.copy(position)
        }
      }
      this.position.copy(position)
    }
    if (quaternion) this.quaternion.copy(quaternion)
    if (scale) this.scale.copy(scale)
  }

  public raycast(raycaster: Raycaster, intersects: Array<Intersection>) {
    const { textRenderInfo, curveRadius } = this.textMesh
    if (textRenderInfo) {
      const bounds = textRenderInfo.blockBounds
      const raycastMesh = curveRadius
        ? this.getCurvedRaycastMesh()
        : this.getFlatRaycastMesh()
      const geom = raycastMesh.geometry
      const { position, uv } = geom.attributes
      for (let i = 0; i < uv.count; i++) {
        let x = bounds[0] + uv.getX(i) * (bounds[2] - bounds[0])
        const y = bounds[1] + uv.getY(i) * (bounds[3] - bounds[1])
        let z = 0
        if (curveRadius) {
          z = curveRadius - Math.cos(x / curveRadius) * curveRadius
          x = Math.sin(x / curveRadius) * curveRadius
        }
        if (this.textMesh.material.defines['BILLBOARD_FIXED']) {
          if (this._resolution.length() === 0) return
          const billboardSize = new Vector2().set(
            (this.textMesh.material.billboardPixelHeight / this._resolution.x) * 2,
            (this.textMesh.material.billboardPixelHeight / this._resolution.y) * 2
          )

          const invProjection = new Matrix4()
            .copy(raycaster.camera.projectionMatrix)
            .invert()
          const invView = new Matrix4()
            .copy(raycaster.camera.matrixWorldInverse)
            .invert()

          const clip = new Vector4(
            this.position.x,
            this.position.y,
            this.position.z,
            1.0
          )
            .applyMatrix4(raycaster.camera.matrixWorldInverse)
            .applyMatrix4(raycaster.camera.projectionMatrix)
          const pDiv = clip.w
          clip.multiplyScalar(1 / pDiv)
          clip.add(new Vector4(x * billboardSize.x, y * billboardSize.y, 0, 0))
          clip.multiplyScalar(pDiv)
          clip.applyMatrix4(invProjection)
          clip.applyMatrix4(invView)
          position.setXYZ(i, clip.x, clip.y, clip.z)
        } else {
          position.setXYZ(i, x, y, z)
        }
      }
      if (this.textMesh.material.defines['BILLBOARD_FIXED']) {
        geom.computeBoundingBox()
        geom.computeBoundingSphere()
        raycastMesh.matrixWorld.identity()
      } else {
        geom.boundingSphere = this.textMesh.geometry.boundingSphere
        geom.boundingBox = this.textMesh.geometry.boundingBox
        raycastMesh.matrixWorld = this.textMesh.matrixWorld
      }
      raycastMesh.material.side = this.textMesh.material.side
      const tempArray: Array<Intersection> = []
      raycastMesh.raycast(raycaster, tempArray)
      for (let i = 0; i < tempArray.length; i++) {
        tempArray[i].object = this
        intersects.push(tempArray[i])
      }
    }
  }

  private updateStyle() {
    this.updateBackground()
  }

  private updateBackground() {
    if (!this._style.backgroundColor) {
      if (this._background) this.remove(this._background)
      this._background = null
      return
    }

    this._text.geometry.computeBoundingBox()
    const sizeBox = this._text.geometry.boundingBox.getSize(new Vector3())
    const sizeDelta = sizeBox.distanceTo(this._backgroundSize)
    let geometry = this._background?.geometry
    if (sizeDelta > 0.1) {
      geometry = this.RectangleRounded(sizeBox.x * 1.2, sizeBox.y * 1.2, 0.5, 5)
      geometry.computeBoundingBox()
      this._backgroundSize.copy(sizeBox)
      if (this._background) this._background.geometry = geometry
    }
    if (this._background === null) {
      const material = new SpeckleBasicMaterial({}, ['BILLBOARD_FIXED'])
      material.toneMapped = false
      material.side = DoubleSide
      material.depthTest = false

      this._background = new Mesh(geometry, material)
      this._background.layers.set(this._layer)
      this._background.frustumCulled = false
      this._background.renderOrder = 1
      this.add(this._background)
    }
    const color = new Color(this._style.backgroundColor).convertSRGBToLinear()
    ;(this._background.material as SpeckleBasicMaterial).color = color
    ;(this._background.material as SpeckleBasicMaterial).billboardPixelHeight =
      (this._style.backgroundPixelHeight !== undefined
        ? this._style.backgroundPixelHeight
        : DefaultSpeckleTextStyle.backgroundPixelHeight || 0) * window.devicePixelRatio
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

    for (let j = 1; j < n; j++) indices.push(0, j, j + 1) // 0 is center
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

    function contour(j: number) {
      qu = Math.trunc((4 * j) / n) + 1 // quadrant  qu: 1..4
      sgx = qu === 1 || qu === 4 ? 1 : -1 // signum left/right
      sgy = qu < 3 ? 1 : -1 // signum  top / bottom
      x = sgx * (w / 2 - r) + r * Math.cos((pi2 * (j - qu + 1)) / (n - 4)) // corner center + circle
      y = sgy * (h / 2 - r) + r * Math.sin((pi2 * (j - qu + 1)) / (n - 4))

      positions.push(x, y, 0)
      uvs.push(0.5 + x / w, 0.5 + y / h)
    }
  }
}
