import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Mesh,
  Raycaster,
  Vector2,
  Vector3,
  type Intersection
} from 'three'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import { Text } from 'troika-three-text'
import SpeckleBasicMaterial, {
  BillboardingType
} from '../materials/SpeckleBasicMaterial.js'
import SpeckleTextMaterial from '../materials/SpeckleTextMaterial.js'
import { ObjectLayers } from '../../index.js'

const _box3: Box3 = new Box3()
const _vec3: Vector3 = new Vector3()

export interface TextLabelParams {
  text?: string
  fontSize?: number
  maxWidth?: number
  anchorX?: string
  anchorY?: string
  billboard?: BillboardingType | null
  backgroundColor?: Color | null
  backgroundCornerRadius?: number
  backgroundMargins?: Vector2
  textColor?: Color
  textOpacity?: number
}

export const DefaultTextLabelParams: TextLabelParams = {
  text: 'Test Text',
  fontSize: 40,
  maxWidth: Number.POSITIVE_INFINITY,
  anchorX: 'center',
  anchorY: 'middle',
  billboard: 'screen',
  backgroundColor: new Color(0xff0000),
  backgroundCornerRadius: 0.5,
  backgroundMargins: new Vector2(50, 10),
  textColor: new Color(0x00ffff),
  textOpacity: 1
}

export class TextLabel extends Text {
  private _background: Mesh | null = null
  private _backgroundMaterial: SpeckleBasicMaterial
  private _params: TextLabelParams = Object.assign({}, DefaultTextLabelParams)
  private _textBounds: Box3 = new Box3()

  public get textMesh() {
    return this
  }

  public get backgroundMesh() {
    return this._background
  }

  public get textBounds(): Box3 {
    return this._textBounds
  }

  public constructor(params: TextLabelParams = DefaultTextLabelParams) {
    super()

    this.material = new SpeckleTextMaterial({}).getDerivedMaterial()
    this.material.toneMapped = false
    this.material.side = DoubleSide

    this._backgroundMaterial = new SpeckleBasicMaterial({})
    this._backgroundMaterial.toneMapped = false
    this._backgroundMaterial.side = DoubleSide
    this._backgroundMaterial.depthTest = false

    void this.updateParams(params)

    this.layers.set(ObjectLayers.OVERLAY)
  }

  public async updateParams(params: TextLabelParams, onUpdateComplete?: () => void) {
    return new Promise<void>((resolve) => {
      if (params.text) this.text = params.text
      if (params.fontSize) this.fontSize = params.fontSize
      if (params.anchorX) this.anchorX = params.anchorX
      if (params.anchorY) this.anchorY = params.anchorY
      if (params.maxWidth) this.maxWidth = params.maxWidth

      if (params.textColor !== undefined) {
        this.material.color.copy(params.textColor)
        this.material.color.convertSRGBToLinear()
      }
      if (params.textOpacity !== undefined) this.material.opacity = params.textOpacity

      this.material.needsUpdate = true
      Object.assign(this._params, params)

      if (this._needsSync) {
        this.sync(() => {
          this.textBoundsToBox(this._textBounds)
          this.updateBackground()
          this.updateBillboarding()

          if (onUpdateComplete) onUpdateComplete()
          resolve()
        })
      } else {
        if (onUpdateComplete) onUpdateComplete()
        resolve()
      }
    })
  }

  public raycast(raycaster: Raycaster, intersects: Array<Intersection>) {
    super.raycast(raycaster, intersects)
    // const { textRenderInfo, curveRadius } = this.textMesh
    // if (textRenderInfo) {
    //   const bounds = textRenderInfo.blockBounds
    //   const raycastMesh = curveRadius
    //     ? this.getCurvedRaycastMesh()
    //     : this.getFlatRaycastMesh()
    //   const geom = raycastMesh.geometry
    //   const { position, uv } = geom.attributes
    //   for (let i = 0; i < uv.count; i++) {
    //     let x = bounds[0] + uv.getX(i) * (bounds[2] - bounds[0])
    //     const y = bounds[1] + uv.getY(i) * (bounds[3] - bounds[1])
    //     let z = 0
    //     if (curveRadius) {
    //       z = curveRadius - Math.cos(x / curveRadius) * curveRadius
    //       x = Math.sin(x / curveRadius) * curveRadius
    //     }
    //     if (this.textMesh.material.defines['BILLBOARD_FIXED']) {
    //       if (this._resolution.length() === 0) return
    //       const backgroundSizeIncrease = this._background ? BACKGROUND_OVERSIZE : 1
    //       const billboardSize = new Vector2().set(
    //         (this.textMesh.material.billboardPixelHeight / this._resolution.x) *
    //           2 *
    //           backgroundSizeIncrease,
    //         (this.textMesh.material.billboardPixelHeight / this._resolution.y) *
    //           2 *
    //           backgroundSizeIncrease
    //       )

    //       const invProjection = new Matrix4()
    //         .copy(raycaster.camera.projectionMatrix)
    //         .invert()
    //       const invView = new Matrix4()
    //         .copy(raycaster.camera.matrixWorldInverse)
    //         .invert()

    //       const clip = new Vector4(
    //         this.position.x,
    //         this.position.y,
    //         this.position.z,
    //         1.0
    //       )
    //         .applyMatrix4(raycaster.camera.matrixWorldInverse)
    //         .applyMatrix4(raycaster.camera.projectionMatrix)
    //       const pDiv = clip.w
    //       clip.multiplyScalar(1 / pDiv)
    //       clip.add(new Vector4(x * billboardSize.x, y * billboardSize.y, 0, 0))
    //       clip.multiplyScalar(pDiv)
    //       clip.applyMatrix4(invProjection)
    //       clip.applyMatrix4(invView)
    //       position.setXYZ(i, clip.x, clip.y, clip.z)
    //     } else {
    //       position.setXYZ(i, x, y, z)
    //     }
    //   }
    //   if (this.textMesh.material.defines['BILLBOARD_FIXED']) {
    //     geom.computeBoundingBox()
    //     geom.computeBoundingSphere()
    //     raycastMesh.matrixWorld.identity()
    //   } else {
    //     geom.boundingSphere = this.textMesh.geometry.boundingSphere
    //     geom.boundingBox = this.textMesh.geometry.boundingBox
    //     raycastMesh.matrixWorld = this.textMesh.matrixWorld
    //   }
    //   raycastMesh.material.side = this.textMesh.material.side
    //   const tempArray: Array<Intersection> = []
    //   raycastMesh.raycast(raycaster, tempArray)
    //   for (let i = 0; i < tempArray.length; i++) {
    //     tempArray[i].object = this
    //     intersects.push(tempArray[i])
    //   }
    // }
  }

  // private updateStyle() {
  // this.updateBackground()
  // }

  private textBoundsToBox(target: Box3 = new Box3()): Box3 {
    const { textRenderInfo } = this
    /** We're using visibleBounds for a better fit */
    const bounds = textRenderInfo.visibleBounds
    // console.log('bounds -> ', bounds)
    const vertices = []
    vertices.push(
      bounds[0],
      bounds[3],
      0,
      bounds[2],
      bounds[3],
      0,
      bounds[0],
      bounds[1],
      0,
      bounds[2],
      bounds[1],
      0
    )
    target.setFromArray(vertices)
    return target
  }

  /** Text's visibleBounds, the one we're working with bounds-wise is not a unit quad
      When using BILLBOARD_SCREEN we store the desired pixel size in the text's `fontSize` property
      This makes troika compute a large text since it thinks our pixels are world units.
      So we divide the text bounds by the font size to get the size of the unit text bounds, or
      another way of putting it, to compute the text bounds value as if fontSize = 1
      From the unit box, we get it's size and compute a world->pixel ratio which we send to the shader
   */
  private updateBillboarding() {
    this.material.setBillboarding(this._params.billboard)
    this._backgroundMaterial.setBillboarding(this._params.billboard)

    if (this._params.billboard === 'screen') {
      /** Get the current bounds */
      const bounds = _box3.copy(this._textBounds)
      /** The fontSize is the pixel value so we normalize */
      bounds.min.divideScalar(this.fontSize)
      bounds.max.divideScalar(this.fontSize)
      /** This is the size of the quad for the particular text value */
      let unitSize = bounds.getSize(_vec3)
      // const aspect = unitSize.y / unitSize.x;
      // float billboardPixelSizeY = billboardPixelHeight / screenSize.y;
      // billboardPixelSize.x = billboardPixelSizeY * aspect;
      // billboardPixelSize.y = billboardPixelSizeY;
      this.material.billboardPixelSize = new Vector2(1 / unitSize.y, 1 / unitSize.y)

      /** Same thing for background */
      const bgBounds = new Box3().copy(this._background?.geometry.boundingBox)
      bgBounds.min.divideScalar(this.fontSize)
      bgBounds.max.divideScalar(this.fontSize)
      unitSize = bgBounds.getSize(_vec3)

      const margins = new Vector2(
        this._params.backgroundMargins?.x ?? 0,
        this._params.backgroundMargins?.y ?? 0
      )
      this._backgroundMaterial.billboardPixelSize = new Vector2(
        1 / unitSize.y + (margins.x * (1 / unitSize.x)) / this.fontSize,
        1 / unitSize.y + (margins.y * (1 / unitSize.y)) / this.fontSize
      )
    }
  }

  private updateBackground() {
    if (!this._params.backgroundColor) {
      if (this._background) this.remove(this._background)
      this._background = null
      return
    }

    const box = _box3.copy(this._textBounds)
    const offset = box.getCenter(new Vector3())
    const boxSize = box.getSize(new Vector3())
    const radius = this.fontSize * (this._params.backgroundCornerRadius ?? 0)
    const margins =
      this._params.billboard !== 'screen'
        ? this._params.backgroundMargins ?? new Vector2()
        : new Vector2()

    const geometry = this.RectangleRounded(
      offset,
      boxSize.x + margins.x,
      boxSize.y + margins.y,
      radius,
      5
    )
    geometry.computeBoundingBox()
    if (this._background) this._background.geometry = geometry

    if (this._background === null) {
      this._background = new Mesh(geometry, this._backgroundMaterial)
      this._background.layers.mask = this.layers.mask
      this._background.frustumCulled = false
      this._background.renderOrder = 1
      this.add(this._background)
    }
    const color = new Color(this._params.backgroundColor).convertSRGBToLinear()
    ;(this._background.material as SpeckleBasicMaterial).color = color
  }

  /** Improved version of https://discourse.threejs.org/t/roundedrectangle-squircle/28645 by way of the vibe */
  private RectangleRounded(
    offset: Vector3,
    w: number,
    h: number,
    r: number,
    s: number,
    inset = false
  ): BufferGeometry {
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    if (inset) {
      let maxInset = 0
      for (let i = 0; i <= s; i++) {
        const angle = (Math.PI / 2) * (i / (s + 1))
        const x = r * Math.cos(angle)
        const inset = r - x
        if (inset > maxInset) maxInset = inset
      }
      w += 2 * maxInset
    }
    const radius = Math.min(r, w / 2, h / 2)
    const segmentsPerCorner = s + 1
    const pointsPerCorner = segmentsPerCorner + 1
    const totalPoints = pointsPerCorner * 4

    positions.push(offset.x, offset.y, 0)
    uvs.push(0.5, 0.5)

    const corners = [
      { cx: w / 2 - radius, cy: h / 2 - radius, angleStart: 0 },
      { cx: -w / 2 + radius, cy: h / 2 - radius, angleStart: Math.PI / 2 },
      { cx: -w / 2 + radius, cy: -h / 2 + radius, angleStart: Math.PI },
      { cx: w / 2 - radius, cy: -h / 2 + radius, angleStart: (3 * Math.PI) / 2 }
    ]

    for (let corner = 0; corner < 4; corner++) {
      const { cx, cy, angleStart } = corners[corner]
      for (let i = 0; i <= segmentsPerCorner; i++) {
        const angle = angleStart + (Math.PI / 2) * (i / segmentsPerCorner)
        const x = cx + radius * Math.cos(angle)
        const y = cy + radius * Math.sin(angle)

        positions.push(offset.x + x, offset.y + y, 0)
        uvs.push(0.5 + x / w, 0.5 + y / h)
      }
    }

    for (let i = 1; i <= totalPoints; i++) {
      const next = i < totalPoints ? i + 1 : 1
      indices.push(0, i, next)
    }

    const geometry = new BufferGeometry()
    geometry.setIndex(new BufferAttribute(new Uint32Array(indices), 1))
    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(positions), 3)
    )
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2))
    geometry.computeBoundingBox()

    return geometry
  }
}
