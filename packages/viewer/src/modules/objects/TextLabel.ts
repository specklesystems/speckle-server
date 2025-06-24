import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Matrix4,
  Mesh,
  Raycaster,
  Vector3,
  type Intersection
} from 'three'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import { Text } from 'troika-three-text'
import SpeckleBasicMaterial from '../materials/SpeckleBasicMaterial.js'
import SpeckleTextMaterial from '../materials/SpeckleTextMaterial.js'
import { ObjectLayers } from '../../index.js'

export type FontSizeUnits = 'world' | 'screen'
export interface TextLabelParams {
  text?: string
  fontSize?: number
  fontSizeUnits?: FontSizeUnits
  maxWidth?: number
  anchorX?: string
  anchorY?: string
  billboard?: boolean
  backgroundColor?: Color | null
  backgroundCornerRadius?: number
  textColor?: Color
  textOpacity?: number
}

export const DefaultTextLabelParams: TextLabelParams = {
  text: 'YYYYYYYY',
  fontSize: 1,
  fontSizeUnits: 'world',
  maxWidth: Number.POSITIVE_INFINITY,
  anchorX: 'center',
  anchorY: 'middle',
  billboard: false,
  backgroundColor: new Color(0xff0000),
  backgroundCornerRadius: 1,
  textColor: new Color(0x00ffff),
  textOpacity: 1
}

export class TextLabel extends Text {
  private _background: Mesh | null = null
  private _params: TextLabelParams = Object.assign({}, DefaultTextLabelParams)

  public get textMesh() {
    return this
  }

  public get backgroundMesh() {
    return this._background
  }

  public constructor(params: TextLabelParams = DefaultTextLabelParams) {
    super()

    this.material = new SpeckleTextMaterial({}).getDerivedMaterial()
    this.material.toneMapped = false
    this.material.side = DoubleSide

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
      if (params.billboard !== undefined) this.material.billboard = params.billboard

      if (params.textColor !== undefined) {
        this.material.color.copy(params.textColor)
        this.material.color.convertSRGBToLinear()
      }
      if (params.textOpacity !== undefined) this.material.opacity = params.textOpacity

      this.material.needsUpdate = true
      Object.assign(this._params, params)

      if (this._needsSync) {
        this.sync(() => {
          this.updateBackground()
          if (onUpdateComplete) onUpdateComplete()
          resolve()
        })
      } else {
        if (onUpdateComplete) onUpdateComplete()
        resolve()
      }
    })
  }

  // public setTransform(position?: Vector3, quaternion?: Quaternion, scale?: Vector3) {
  //   if (position) {
  //     if (this._style.billboard) {
  //       this.textMesh.material.userData.billboardPos.value.copy(position)
  //       if (this._background) {
  //         const textSize = this.textMesh.geometry.boundingBox.getSize(new Vector3())
  //         const textCenter = this.textMesh.geometry.boundingBox.getCenter(new Vector3())
  //         const offset = new Vector3()
  //           .copy(textCenter)
  //           .multiplyScalar(BACKGROUND_OVERSIZE)
  //         const sizeOffset = new Vector3()
  //           .copy(textSize)
  //           .multiplyScalar(BACKGROUND_OVERSIZE)
  //           .sub(textSize)
  //         offset.x +=
  //           textCenter.x < 0 ? sizeOffset.x : textCenter.x > 0 ? -sizeOffset.x : 0
  //         offset.y +=
  //           textCenter.y < 0 ? sizeOffset.y : textCenter.y > 0 ? -sizeOffset.y : 0
  //         ;(this._background.material as SpeckleBasicMaterial).billboardOffset =
  //           new Vector2(offset.x, offset.y)
  //         ;(
  //           this._background.material as SpeckleBasicMaterial
  //         ).userData.billboardPos.value.copy(position)
  //       }
  //     }
  //     this.position.copy(position)
  //   }
  //   if (quaternion) this.quaternion.copy(quaternion)
  //   if (scale) this.scale.copy(scale)
  // }

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

  private updateBackground() {
    if (!this._params.backgroundColor) {
      if (this._background) this.remove(this._background)
      this._background = null
      return
    }

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
    /** Check if text scale should be taken into account */
    const box = new Box3().setFromArray(vertices)
    const offset = box.getCenter(new Vector3())
    const matrix = new Matrix4().extractRotation(this.matrixWorld).invert()
    box.applyMatrix4(new Matrix4().copy(this.matrixWorld).multiply(matrix))
    const boxSize = box.getSize(new Vector3())
    const geometry = this.RectangleRounded(offset, boxSize.x, boxSize.y, 0.5, 5)
    geometry.computeBoundingBox()
    if (this._background) this._background.geometry = geometry

    // this._text.geometry.computeBoundingBox()
    // const sizeBox = this._text.geometry.boundingBox.getSize(new Vector3())
    // const sizeDelta = sizeBox.distanceTo(this._backgroundSize)
    // let geometry = this._background?.geometry
    // if (sizeDelta > 0.1) {
    //   /** BACKGROUND_OVERSIZE should not be required for billboarded backgrounds. Weird */
    //   geometry = this.RectangleRounded(
    //     sizeBox.x * BACKGROUND_OVERSIZE,
    //     sizeBox.y * BACKGROUND_OVERSIZE,
    //     0.5,
    //     5
    //   )
    //   geometry.computeBoundingBox()
    //   this._backgroundSize.copy(sizeBox)
    //   if (this._background) this._background.geometry = geometry
    // }
    if (this._background === null) {
      const material = new SpeckleBasicMaterial(
        {},
        this.material.billboard ? ['BILLBOARD'] : []
      )
      material.toneMapped = false
      material.side = DoubleSide
      material.depthTest = false

      this._background = new Mesh(geometry, material)
      this._background.layers.mask = this.layers.mask
      this._background.frustumCulled = false
      this._background.renderOrder = 1
      this.add(this._background)
    }
    const color = new Color(this._params.backgroundColor).convertSRGBToLinear()
    ;(this._background.material as SpeckleBasicMaterial).color = color
    // ;(this._background.material as SpeckleBasicMaterial).billboardPixelHeight =
    //   (this._style.backgroundPixelHeight !== undefined
    //     ? this._style.backgroundPixelHeight
    //     : DefaultSpeckleTextStyle.backgroundPixelHeight || 0) * window.devicePixelRatio
  }

  /** Improved version of https://discourse.threejs.org/t/roundedrectangle-squircle/28645 by way of the vibe */
  private RectangleRounded(
    offset: Vector3,
    w: number,
    h: number,
    r: number,
    s: number
  ): BufferGeometry {
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    let maxInset = 0
    for (let i = 0; i <= s; i++) {
      const angle = (Math.PI / 2) * (i / (s + 1))
      const x = r * Math.cos(angle)
      const inset = r - x
      if (inset > maxInset) maxInset = inset
    }
    w += 2 * maxInset

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
