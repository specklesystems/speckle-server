/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-ignore
import { Text } from 'troika-three-text'
//@ts-ignore
import { BatchedText } from 'troika-three-text/src/BatchedText.js'
import { TopLevelAccelerationStructure } from './TopLevelAccelerationStructure.js'
import {
  Box3,
  Color,
  DataTexture,
  FloatType,
  Intersection,
  Material,
  Matrix4,
  Mesh,
  Object3D,
  Ray,
  Raycaster,
  RGBAFormat,
  Sphere
} from 'three'
import { BatchObject } from '../batching/BatchObject.js'
import { SpeckleRaycaster } from './SpeckleRaycaster.js'
import { DrawGroup } from '../batching/Batch.js'
import Logger from '../utils/Logger.js'

const ray = /* @__PURE__ */ new Ray()
const tmpInverseMatrix = /* @__PURE__ */ new Matrix4()

export class SpeckleText extends BatchedText {
  private tas: TopLevelAccelerationStructure
  private batchMaterial: Material
  private _batchObjects: BatchObject[]

  public groups: Array<DrawGroup> = []
  public materials: Material[] = []

  public dirty: boolean = false

  public get TAS(): TopLevelAccelerationStructure {
    return this.tas
  }

  public get batchObjects(): BatchObject[] {
    return this._batchObjects
  }

  public setBatchMaterial(material: Material) {
    this.batchMaterial = material
    //@ts-ignore
    this.material = material
    this.materials.push(this.batchMaterial)
  }

  public setBatchObjects(batchObjects: BatchObject[]) {
    this._batchObjects = batchObjects
  }

  public buildTAS() {
    this.tas = new TopLevelAccelerationStructure(this.batchObjects)
    /** We do a refit here, because for some reason the bvh library incorrectly computes the total bvh bounds at creation,
     *  so we force a refit in order to get the proper bounds value out of it
     */
    this.tas.refit()

    /** Copy computed bounds over so that three.js doesn't freak out */
    ;(this as unknown as Mesh).geometry.boundingBox = this.TAS.getBoundingBox(
      new Box3()
    )
    //@ts-ignore
    ;(this as unknown as Mesh).geometry.boundingSphere = (
      this as unknown as Mesh
    ).geometry.boundingBox.getBoundingSphere(new Sphere())
  }

  // converts the given BVH raycast intersection to align with the three.js raycast
  // structure (include object, world space distance and point).
  private convertRaycastIntersect(
    hit: Intersection | null,
    object: Object3D,
    raycaster: Raycaster
  ) {
    if (hit === null) {
      return null
    }

    hit.point.applyMatrix4(object.matrixWorld)
    hit.distance = hit.point.distanceTo(raycaster.ray.origin)
    hit.object = object

    if (hit.distance < raycaster.near || hit.distance > raycaster.far) {
      return null
    } else {
      return hit
    }
  }

  public getBatchObjectMaterial(batchObject: BatchObject) {
    const rv = batchObject.renderView
    const group = this.groups.find((value) => {
      return (
        rv.batchStart >= value.start &&
        rv.batchStart + rv.batchCount <= value.count + value.start
      )
    })
    if (!group) {
      Logger.warn(`Could not get material for ${batchObject.renderView.renderData.id}`)
      return null
    }
    return this.materials[group.materialIndex]
  }

  raycast(raycaster: SpeckleRaycaster, intersects: Array<Intersection>) {
    if (this.tas) {
      if (this.batchMaterial === undefined) return

      //@ts-ignore
      tmpInverseMatrix.copy(this.matrixWorld).invert()
      ray.copy(raycaster.ray).applyMatrix4(tmpInverseMatrix)

      if (raycaster.firstHitOnly === true) {
        const hit = this.convertRaycastIntersect(
          this.tas.raycastFirst(ray, raycaster.intersectTASOnly, this.batchMaterial),
          this as unknown as Object3D,
          raycaster
        )
        if (hit) {
          intersects.push(hit)
        }
      } else {
        const hits = this.tas.raycast(
          ray,
          raycaster.intersectTASOnly,
          this.batchMaterial
        )
        for (let i = 0, l = hits.length; i < l; i++) {
          const hit = this.convertRaycastIntersect(
            hits[i],
            this as unknown as Object3D,
            raycaster
          )
          if (hit) {
            intersects.push(hit)
          }
        }
      }
    } else {
      super.raycast(raycaster, intersects)
    }
  }

  /**
   * @param {Text} text
   */
  addText(text: Text) {
    //@ts-ignore
    if (!this._members.has(text)) {
      //@ts-ignore
      this._members.set(text, {
        index: -1,
        glyphCount: -1,
        dirty: true,
        needsUpdate: true
      })
      //@ts-ignore
      text.addEventListener('synccomplete', this._onMemberSynced)
    }
  }

  /**
   * @override
   * Patched version that allows:
   * - Individual text opacities
   */
  //@ts-ignore
  _prepareForRender(material) {
    if (!this.dirty) return

    this.dirty = false

    const floatsPerMember = 32
    const tempColor = new Color()
    const isOutline = material.isTextOutlineMaterial
    material.uniforms.uTroikaIsOutline.value = isOutline

    // Resize the texture to fit in powers of 2
    //@ts-ignore
    let texture = this._dataTextures[isOutline ? 'outline' : 'main']
    const dataLength = Math.pow(
      2,
      //@ts-ignore
      Math.ceil(Math.log2(this._members.size * floatsPerMember))
    )
    if (!texture || dataLength !== texture.image.data.length) {
      // console.log(`resizing: ${dataLength}`);
      if (texture) texture.dispose()
      const width = Math.min(dataLength / 4, 1024)
      //@ts-ignore
      texture = this._dataTextures[isOutline ? 'outline' : 'main'] = new DataTexture(
        new Float32Array(dataLength),
        width,
        dataLength / 4 / width,
        RGBAFormat,
        FloatType
      )
    }

    const texData = texture.image.data
    //@ts-ignore
    const setTexData = (index, value) => {
      if (value !== texData[index]) {
        texData[index] = value
        texture.needsUpdate = true
      }
    }
    //@ts-ignore
    this._members.forEach((packingInfo, text) => {
      if (packingInfo.index > -1 && packingInfo.needsUpdate) {
        packingInfo.needsUpdate = false
        const startIndex = packingInfo.index * floatsPerMember

        // Matrix
        const matrix = text.matrix.elements
        for (let i = 0; i < 16; i++) {
          setTexData(startIndex + i, matrix[i])
        }

        // Let the member populate the uniforms, since that does all the appropriate
        // logic and handling of defaults, and we'll just grab the results from there
        text._prepareForRender(material)
        const {
          uTroikaTotalBounds,
          uTroikaClipRect,
          uTroikaPositionOffset,
          uTroikaEdgeOffset,
          uTroikaBlurRadius,
          uTroikaStrokeWidth,
          uTroikaStrokeColor,
          uTroikaStrokeOpacity,
          uTroikaFillOpacity,
          uTroikaCurveRadius
        } = material.uniforms

        // Total bounds for uv
        for (let i = 0; i < 4; i++) {
          setTexData(startIndex + 16 + i, uTroikaTotalBounds.value.getComponent(i))
        }

        // Clip rect
        for (let i = 0; i < 4; i++) {
          setTexData(startIndex + 20 + i, uTroikaClipRect.value.getComponent(i))
        }

        // Color
        let color = isOutline ? text.outlineColor || 0 : text.color
        //@ts-ignore
        if (color === null) color = this.color
        //@ts-ignore
        if (color === null) color = this.material.color
        if (color === null) color = 0xffffff
        setTexData(startIndex + 24, tempColor.set(color).getHex())

        // Fill opacity / outline opacity
        setTexData(startIndex + 25, text.material.opacity ?? uTroikaFillOpacity.value)

        // Curve radius
        setTexData(startIndex + 26, uTroikaCurveRadius.value)

        if (isOutline) {
          // Outline properties
          setTexData(startIndex + 28, uTroikaPositionOffset.value.x)
          setTexData(startIndex + 29, uTroikaPositionOffset.value.y)
          setTexData(startIndex + 30, uTroikaEdgeOffset.value)
          setTexData(startIndex + 31, uTroikaBlurRadius.value)
        } else {
          // Stroke properties
          setTexData(startIndex + 28, uTroikaStrokeWidth.value)
          setTexData(startIndex + 29, tempColor.set(uTroikaStrokeColor.value).getHex())
          setTexData(startIndex + 30, uTroikaStrokeOpacity.value)
        }
      }
    })
    material.setMatrixTexture(texture)

    // For the non-member-specific uniforms:
    //@ts-ignore
    Text.prototype._prepareForRender.call(this, material)
  }
}
