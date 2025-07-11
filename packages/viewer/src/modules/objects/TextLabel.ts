import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  FrontSide,
  Int16BufferAttribute,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  Vector2,
  Vector3,
  Vector4,
  type Intersection
} from 'three'
import { AnchorX, AnchorY, Text } from 'troika-three-text'
import SpeckleBasicMaterial, {
  BillboardingType
} from '../materials/SpeckleBasicMaterial.js'
import SpeckleTextMaterial from '../materials/SpeckleTextMaterial.js'
import { ObjectLayers } from '../../index.js'
import Logger from '../utils/Logger.js'

const _mat40: Matrix4 = new Matrix4()
const _mat41: Matrix4 = new Matrix4()
const _box3: Box3 = new Box3()
const _vec3: Vector3 = new Vector3()
const _vec4: Vector4 = new Vector4()
const quadVerts = [new Vector3(), new Vector3(), new Vector3(), new Vector3()]

export interface TextLabelParams {
  text?: string
  fontSize?: number
  maxWidth?: number
  anchorX?: AnchorX
  anchorY?: AnchorY
  billboard?: BillboardingType | null
  backgroundColor?: Color | null
  backgroundCornerRadius?: number
  backgroundMargins?: Vector2
  textColor?: Color
  textOpacity?: number
  objectLayer?: ObjectLayers
}

/** Screen */
export const DefaultTextLabelParams: Required<TextLabelParams> = {
  text: 'Test Text',
  fontSize: 40,
  maxWidth: Number.POSITIVE_INFINITY,
  anchorX: 'left',
  anchorY: 'middle',
  billboard: 'screen',
  backgroundColor: new Color(0xff0000),
  backgroundCornerRadius: 0.5,
  backgroundMargins: new Vector2(50, 10),
  textColor: new Color(0x00ffff),
  textOpacity: 1,
  objectLayer: ObjectLayers.OVERLAY
}

// /** World Billboard*/
// export const DefaultTextLabelParams: Required<TextLabelParams> = {
//   text: 'Test Text',
//   fontSize: 1,
//   maxWidth: Number.POSITIVE_INFINITY,
//   anchorX: 'left',
//   anchorY: 'middle',
//   billboard: 'world',
//   backgroundColor: new Color(0xff0000),
//   backgroundCornerRadius: 0.5,
//   backgroundMargins: new Vector2(0.75, 0.1),
//   textColor: new Color(0x00ffff),
//   textOpacity: 1,
//   objectLayer: ObjectLayers.OVERLAY
// }

// /** World */
// export const DefaultTextLabelParams: Required<TextLabelParams> = {
//   text: 'Test Text',
//   fontSize: 1,
//   maxWidth: Number.POSITIVE_INFINITY,
//   anchorX: 'center',
//   anchorY: 'middle',
//   billboard: null,
//   backgroundColor: new Color(0xff0000),
//   backgroundCornerRadius: 0.5,
//   backgroundMargins: new Vector2(0.75, 0.1),
//   textColor: new Color(0x00ffff),
//   textOpacity: 1,
//   objectLayer: ObjectLayers.OVERLAY
// }

export class TextLabel extends Text {
  /** Needs a raycast to start rendering */
  private readonly DEBUG_BILLBOARDS = false

  declare material: SpeckleTextMaterial

  private _background: Mesh
  private _backgroundMaterial: SpeckleBasicMaterial
  private _params: Required<TextLabelParams> = Object.assign({}, DefaultTextLabelParams)
  private _textBounds: Box3 = new Box3()
  private _collisionMesh: Mesh
  public get textMesh() {
    return this
  }

  public get backgroundMesh() {
    return this._background
  }

  public get textBounds(): Box3 {
    return this._textBounds
  }

  public get backgroundMaterial(): SpeckleBasicMaterial {
    return this._backgroundMaterial
  }

  public constructor(params: TextLabelParams = DefaultTextLabelParams) {
    super()
    this.depthOffset = -0.1

    this.material = new SpeckleTextMaterial({}).getDerivedMaterial()
    this.material.toneMapped = false

    this._backgroundMaterial = new SpeckleBasicMaterial({})
    this._backgroundMaterial.toneMapped = false

    this._background = new Mesh(undefined, this._backgroundMaterial)
    /** Otherwise three.js looses it's shit when rendering it billboarded */
    this._background.frustumCulled = false
    /** No raycasting for the background */
    this._background.raycast = () => {}

    const geometry = new BufferGeometry()
    geometry.setAttribute(
      'position',
      new Float32BufferAttribute(new Array(12).fill(0), 3)
    )
    geometry.setIndex(
      // prettier-ignore
      new Int16BufferAttribute(
        [ 
          0, 1, 2, // First triangle: bottom-left → bottom-right → top-right
          0, 2, 3 // Second triangle: bottom-left → top-right → top-left
        ],
        1
      )
    )
    this._collisionMesh = new Mesh(
      geometry,
      new MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
    )
    this._collisionMesh.name = 'TextLabel_Collision_Mesh'
    this._collisionMesh.renderOrder = 1
    this._collisionMesh.visible = this.DEBUG_BILLBOARDS
    this.add(this._collisionMesh)

    this.updateParams(params).then().catch
  }

  public async updateParams(params: TextLabelParams, onUpdateComplete?: () => void) {
    return new Promise<void>((resolve) => {
      if (this.material && !(this.material instanceof SpeckleTextMaterial)) {
        const mat: Material = this.material
        Logger.error(
          `TextLabel requires a SpeckleTextMaterial instance. Found ${mat.constructor.name}`
        )
      }

      /** Automatically scale with DPR */
      const transformedParams = Object.assign({}, params)
      if (params.billboard === 'screen') {
        if (transformedParams.backgroundMargins)
          transformedParams.backgroundMargins.multiplyScalar(window.devicePixelRatio)
        if (transformedParams.fontSize) {
          transformedParams.fontSize *= window.devicePixelRatio
        }
        this.material.side = FrontSide
        this._backgroundMaterial.side = FrontSide
      } else {
        this.material.side = DoubleSide
        this._backgroundMaterial.side = DoubleSide
      }

      if (transformedParams.text) this.text = transformedParams.text
      if (transformedParams.fontSize) this.fontSize = transformedParams.fontSize
      if (transformedParams.anchorX) this.anchorX = transformedParams.anchorX
      if (transformedParams.anchorY) this.anchorY = transformedParams.anchorY
      if (transformedParams.maxWidth) this.maxWidth = transformedParams.maxWidth

      if (transformedParams.textColor !== undefined) {
        this.material.color.copy(transformedParams.textColor)
        this.material.color.convertSRGBToLinear()
      }
      if (transformedParams.textOpacity !== undefined)
        this.material.opacity = transformedParams.textOpacity

      if (transformedParams.objectLayer !== undefined) {
        this.layers.set(transformedParams.objectLayer)
        this._collisionMesh.layers.set(transformedParams.objectLayer)
        this._background.layers.set(transformedParams.objectLayer)
      }

      this.material.needsUpdate = true
      Object.assign(this._params, transformedParams)

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
    /** No billboarding, default raycasting works fine */
    if (!this._params.billboard) {
      super.raycast(raycaster, intersects)
      return
    }
    /** If we have a billboard, we need to update the collision mesh */
    const textMatrix = this.matrixWorld
    const textMatrixInv = _mat40.copy(textMatrix).invert()

    const billboardPos = new Vector3().set(
      textMatrix.elements[12],
      textMatrix.elements[13],
      textMatrix.elements[14]
    )

    /** World space billboarding */
    if (this._params.billboard === 'world') {
      const box = new Box3().copy(
        this._params.backgroundColor !== null
          ? (this._background.geometry.boundingBox as Box3)
          : this._textBounds
      )
      const min = new Vector3().copy(box.min)
      const max = new Vector3().copy(box.max)
      quadVerts[0].set(min.x, min.y, 0)
      quadVerts[1].set(max.x, min.y, 0)
      quadVerts[2].set(max.x, max.y, 0)
      quadVerts[3].set(min.x, max.y, 0)

      const cameraRotationMatrix = _mat41.extractRotation(raycaster.camera.matrixWorld)

      const billboardMat = new Matrix4().makeTranslation(
        billboardPos.x,
        billboardPos.y,
        billboardPos.z
      )
      billboardMat.premultiply(textMatrixInv)
      billboardMat.multiply(cameraRotationMatrix)

      for (let i = 0; i < quadVerts.length; i++) {
        quadVerts[i].applyMatrix4(billboardMat)

        this._collisionMesh.geometry.attributes.position.setXYZ(
          i,
          quadVerts[i].x,
          quadVerts[i].y,
          quadVerts[i].z
        )
      }
    }

    /** Screen space billboarding */
    if (this._params.billboard === 'screen') {
      const box = new Box3().copy(this._textBounds)
      if (box.getSize(new Vector3()).length() === 0) return
      if (box.isInfiniteBox()) return

      const min = new Vector3().copy(box.min)
      const max = new Vector3().copy(box.max)
      quadVerts[0].set(min.x, min.y, 0)
      quadVerts[1].set(max.x, min.y, 0)
      quadVerts[2].set(max.x, max.y, 0)
      quadVerts[3].set(min.x, max.y, 0)

      const billboardSize =
        this._params.backgroundColor !== null
          ? this._backgroundMaterial.userData.billboardPixelOffsetSize.value
          : this._backgroundMaterial.userData.billboardPixelOffsetSize.value
      const invProjection = raycaster.camera.projectionMatrixInverse
      const invView = raycaster.camera.matrixWorld

      const clip = new Vector4(billboardPos.x, billboardPos.y, billboardPos.z, 1.0)
        .applyMatrix4(raycaster.camera.matrixWorldInverse)
        .applyMatrix4(raycaster.camera.projectionMatrix)
      const pDiv = clip.w
      clip.multiplyScalar(1 / pDiv)

      for (let i = 0; i < quadVerts.length; i++) {
        _vec3.copy(quadVerts[i])
        _vec3.multiply(new Vector3(billboardSize.z * 2, billboardSize.w * 2, 0))
        _vec3.add(new Vector3(billboardSize.x * 2, billboardSize.y * 2, 0))
        _vec4.set(clip.x, clip.y, clip.z, 1)
        _vec4.add(new Vector4(_vec3.x, _vec3.y, 0, 0))
        _vec4.multiplyScalar(pDiv)
        _vec4.applyMatrix4(invProjection)
        _vec4.applyMatrix4(invView)
        _vec4.applyMatrix4(textMatrixInv)

        this._collisionMesh.geometry.attributes.position.setXYZ(
          i,
          _vec4.x,
          _vec4.y,
          _vec4.z
        )
      }
    }

    this._collisionMesh.geometry.attributes.position.needsUpdate = true
    this._collisionMesh.geometry.computeBoundingBox()
    this._collisionMesh.geometry.computeBoundingSphere()

    /** No need to manually call. _collisionMesh is a child and will get automatically raycasted */
    this._collisionMesh.raycast(raycaster, intersects)
    // super.raycast(raycaster, intersects)
  }

  /** Gets the current bounds reported by troika taking `fontSize` into account */
  private textBoundsToBox(target: Box3 = new Box3()): Box3 {
    const { textRenderInfo } = this
    /** visibleBounds generally is a better fit, *however* it reports faulty on some glyphs and messes up the text size */
    const bounds = textRenderInfo.visibleBounds

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

  /** Text's blockBounds, the one we're working with bounds-wise is not a unit quad
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
      /** We need to keep aspect ratio for text */
      this.material.billboardPixelSize = new Vector2(1 / unitSize.y, 1 / unitSize.y)
      /** Same thing for background */
      if (!this._background.geometry.boundingBox)
        this._background.geometry.computeBoundingBox()
      const bgBounds = new Box3().copy(this._background.geometry.boundingBox as Box3)
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

      const billboardPixelOffset = new Vector2(0, 0)
      switch (this.anchorX) {
        case 'left':
          billboardPixelOffset.x = -margins.x * 0.5
          break
        case 'right':
          billboardPixelOffset.x = margins.x * 0.5
          break
        default:
          break
      }

      switch (this.anchorY) {
        case 'top':
          billboardPixelOffset.y = -margins.y * 0.5
          break
        case 'bottom':
          billboardPixelOffset.x = margins.y * 0.5
          break
        default:
          break
      }
      this._backgroundMaterial.billboardPixelOffset = billboardPixelOffset
    }
  }

  private updateBackground() {
    if (!this._params.backgroundColor) {
      if (this._background) {
        this._background.geometry.dispose()
        this.remove(this._background)
      }
      return
    } else if (!this._background.parent) {
      this.add(this._background)
    }

    const box = _box3.copy(this._textBounds)
    const offset = box.getCenter(new Vector3())
    const boxSize = box.getSize(new Vector3())
    const radius = this.fontSize * (this._params.backgroundCornerRadius ?? 0)
    const margins =
      this._params.billboard !== 'screen'
        ? this._params.backgroundMargins ?? new Vector2()
        : new Vector2()

    if (!box.isInfiniteBox()) {
      const geometry = this.RectangleRounded(
        offset,
        boxSize.x + margins.x,
        boxSize.y + margins.y,
        radius,
        5
      )
      geometry.computeBoundingBox()
      geometry.computeBoundingSphere()
      this._background.geometry = geometry
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
