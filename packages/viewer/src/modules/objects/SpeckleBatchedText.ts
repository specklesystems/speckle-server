import { Text } from 'troika-three-text'
import { BatchedText } from 'troika-three-text'
import { TopLevelAccelerationStructure } from './TopLevelAccelerationStructure.js'
import {
  Box3,
  BufferGeometry,
  Camera,
  Color,
  DataTexture,
  Float32BufferAttribute,
  FloatType,
  Int16BufferAttribute,
  Intersection,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Ray,
  Raycaster,
  RGBAFormat,
  Scene,
  Sphere,
  Texture,
  Vector3
} from 'three'
import { BatchObject } from '../batching/BatchObject.js'
import { ExtendedMeshIntersection, SpeckleRaycaster } from './SpeckleRaycaster.js'
import { DrawGroup } from '../batching/Batch.js'
import Logger from '../utils/Logger.js'
import Materials from '../materials/Materials.js'
import SpeckleTextMaterial from '../materials/SpeckleTextMaterial.js'
import { Geometry } from '../converter/Geometry.js'
import { TextBatchObject } from '../batching/TextBatchObject.js'
import { ObjectLayers, SpeckleWebGLRenderer } from '../../index.js'

const ray = /* @__PURE__ */ new Ray()
const tmpInverseMatrix = /* @__PURE__ */ new Matrix4()
const vecBuff0 = /* @__PURE__ */ new Vector3()
const vecBuff1 = /* @__PURE__ */ new Vector3()
const vecBuff2 = /* @__PURE__ */ new Vector3()
const matBuff0 = /* @__PURE__ */ new Matrix4()
const matBuff1 = /* @__PURE__ */ new Matrix4()
const matBuff2 = /* @__PURE__ */ new Matrix4()

export class SpeckleBatchedText extends BatchedText {
  declare material: SpeckleTextMaterial

  private tas: TopLevelAccelerationStructure
  private _batchMaterial: SpeckleTextMaterial
  private _batchObjects: BatchObject[]
  private _textObjects: { [id: string]: Text } = {}
  private _dirty: boolean = false

  public groups: Array<DrawGroup> = []
  public materials: Material[] = []

  private materialCache: { [id: string]: Material } = {}
  private materialCacheLUT: { [id: string]: number } = {}

  private readonly DEBUG_BILLBOARDS = false
  private debugMeshes: Mesh[] = []

  public get TAS(): TopLevelAccelerationStructure {
    return this.tas
  }

  public get batchObjects(): BatchObject[] {
    return this._batchObjects
  }

  public get batchMaterial(): Material {
    return this._batchMaterial
  }

  public set dirty(value: boolean) {
    this._dirty = value
  }

  public get isBillboarded() {
    return (
      this._batchMaterial &&
      this._batchMaterial.defines &&
      this._batchMaterial.defines['BILLBOARD']
    )
  }

  public setBatchMaterial(material: Material) {
    if (!(material instanceof SpeckleTextMaterial)) {
      Logger.error(
        `SpeckleBatchedText requires a SpeckleTextMaterial. Found ${material.constructor.name}`
      )
      return
    }
    this._batchMaterial = this.getCachedMaterial(material) as SpeckleTextMaterial
    this.material = this._batchMaterial
    this.materials.push(this._batchMaterial)
  }

  public setBatchObjects(batchObjects: BatchObject[], textObjects: Text[]) {
    this._batchObjects = batchObjects
    for (let k = 0; k < batchObjects.length; k++) {
      const id = batchObjects[k].renderView.renderData.id
      this._textObjects[id] = textObjects[k]
    }
  }

  private lookupMaterial(material: Material) {
    return (
      this.materialCache[material.id] ||
      this.materialCache[this.materialCacheLUT[material.id]]
    )
  }

  public getCachedMaterial(material: Material, copy = false): Material {
    let cachedMaterial = this.lookupMaterial(material)
    if (!cachedMaterial) {
      const clone = new SpeckleTextMaterial({})
        .copy(material)
        .getDerivedBatchedMaterial()
      this.materialCache[material.id] = clone
      this.materialCacheLUT[clone.id] = material.id
      cachedMaterial = clone
    } else if (
      copy ||
      (material as never)['needsCopy'] ||
      (cachedMaterial as never)['needsCopy']
    ) {
      Materials.fastCopy(material, cachedMaterial)
    }
    return cachedMaterial
  }

  public buildTAS() {
    this.tas = new TopLevelAccelerationStructure(this.batchObjects)
    /** We do a refit here, because for some reason the bvh library incorrectly computes the total bvh bounds at creation,
     *  so we force a refit in order to get the proper bounds value out of it
     */
    this.tas.refit()

    /** Copy computed bounds over so that three.js doesn't freak out */
    this.geometry.boundingBox = this.TAS.getBoundingBox(new Box3())
    this.geometry.boundingSphere = this.geometry.boundingBox.getBoundingSphere(
      new Sphere()
    )
  }

  /** This could be made faster. BUT, as this point in time it's not worth the effort */
  public updateTransformsUniform() {
    let needsUpdate = false
    for (let k = 0; k < this._batchObjects.length; k++) {
      const batchObject = this._batchObjects[k]
      if (!(needsUpdate ||= batchObject.transformDirty)) continue
      const textObject = this._textObjects[batchObject.renderView.renderData.id]
      batchObject.transform.decompose(
        textObject.position,
        textObject.quaternion,
        textObject.scale
      )
      textObject.updateMatrix()
      // Matrix
      const matrix = textObject.matrix.elements
      const texture =
        this._dataTextures[
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          textObject.material.isTextOutlineMaterial ? 'outline' : 'main'
        ]
      const packingInfo = this._members.get(textObject)
      if (packingInfo) {
        const startIndex = packingInfo.index * 32
        for (let i = 0; i < 16; i++) {
          this.setTexData(texture, startIndex + i, matrix[i])
        }
        batchObject.transformDirty = false
      }
    }
    if (this.tas && needsUpdate) {
      this.tas.refit()
      this.tas.getBoundingBox(this.tas.bounds)
    }
  }

  public updateMaterialTransformsUniform(material: Material) {
    material
  }

  public setGradientTexture(texture: Texture) {
    this._batchMaterial.setGradientTexture(texture)
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

  private initDebugBox() {
    const debugBox = new Mesh(
      new BufferGeometry(),
      new MeshBasicMaterial({ wireframe: true, color: 0xff0000 })
    )
    debugBox.geometry.setAttribute(
      'position',
      new Float32BufferAttribute(new Array(12), 3)
    )
    debugBox.geometry.setIndex(
      // prettier-ignore
      new Int16BufferAttribute(
        [
          0, 1, 2, // First triangle: bottom-left → bottom-right → top-right
          0, 2, 3 // Second triangle: bottom-left → top-right → top-left
        ],
        1
      )
    )
    debugBox.layers.set(ObjectLayers.OVERLAY)
    this.parent?.add(debugBox)
    return debugBox
  }

  /** Debug purposes only */
  onBeforeRender(
    renderer: SpeckleWebGLRenderer,
    scene: Scene,
    camera: Camera,
    geometry: BufferGeometry,
    material: Material,
    group: unknown
  ) {
    super.onBeforeRender(renderer, scene, camera, geometry, material, group)
    if (this.DEBUG_BILLBOARDS && this.isBillboarded) {
      const vertices = [new Vector3(), new Vector3(), new Vector3(), new Vector3()]
      for (let k = 0; k < this._batchObjects.length; k++) {
        if (!this.debugMeshes[k]) {
          this.debugMeshes[k] = this.initDebugBox()
        }
        const textMatrix = (this._batchObjects[k] as TextBatchObject).textTransform

        const billboardPos = vecBuff0.set(
          textMatrix.elements[12],
          textMatrix.elements[13],
          textMatrix.elements[14]
        )

        const box = new Box3().copy(this._batchObjects[k].aabb)
        const min = vecBuff1.copy(box.min)
        const max = vecBuff2.copy(box.max)
        vertices[0].set(min.x, min.y, 0)
        vertices[1].set(max.x, min.y, 0)
        vertices[2].set(max.x, max.y, 0)
        vertices[3].set(min.x, max.y, 0)

        const billboardMat = matBuff0.makeTranslation(
          billboardPos.x,
          billboardPos.y,
          billboardPos.z
        )

        billboardMat.multiply(matBuff1.extractRotation(camera.matrixWorld))
        // TO DO: This is out of place. Probably happening because acceleration structure has the text transform as input transform
        billboardMat.multiply(matBuff2.copy(textMatrix).invert())

        for (let i = 0; i < vertices.length; i++) {
          const debugVertex = vecBuff2.copy(vertices[i])
          debugVertex.applyMatrix4(billboardMat)

          this.debugMeshes[k].geometry.attributes.position.setXYZ(
            i,
            debugVertex.x,
            debugVertex.y,
            debugVertex.z
          )
        }
        this.debugMeshes[k].geometry.attributes.position.needsUpdate = true
      }
    }
  }

  raycast(raycaster: SpeckleRaycaster, intersects: Array<Intersection>) {
    /** We bypass the TAS for billboarded text batches, otherwise we would need to refit it each frame */
    if (this.isBillboarded) {
      const rayBuff = new Ray()
      for (let k = 0; k < this._batchObjects.length; k++) {
        const textMatrix = (this._batchObjects[k] as TextBatchObject).textTransform
        /** The billboard position is the text object's position stored in it's world matrix */
        const billboardPos = vecBuff0.set(
          textMatrix.elements[12],
          textMatrix.elements[13],
          textMatrix.elements[14]
        )
        /** We compute the matrix that billboards the text */
        const billboardMat = matBuff0.makeTranslation(
          billboardPos.x,
          billboardPos.y,
          billboardPos.z
        )
        billboardMat.multiply(matBuff1.extractRotation(raycaster.camera.matrixWorld))
        billboardMat.multiply(matBuff2.copy(textMatrix).invert())
        /** We invert it in order to apply to the ray instead of the geometry */
        const invBillboardMat = matBuff0.copy(billboardMat).invert()
        rayBuff.copy(raycaster.ray)
        rayBuff.applyMatrix4(invBillboardMat)

        /** Regular intersecting from here on out on a per batch object level */
        if (raycaster.firstHitOnly === true) {
          const hit = this.convertRaycastIntersect(
            this._batchObjects[k].accelerationStructure.raycastFirst(
              rayBuff,
              this._batchMaterial
            ),
            this as unknown as Object3D,
            raycaster
          ) as ExtendedMeshIntersection
          if (hit) {
            hit.batchObject = this._batchObjects[k]
            intersects.push(hit)
            break // We break here as we only want the first hit
          }
        } else {
          const hits = this._batchObjects[k].accelerationStructure.raycast(
            rayBuff,
            this._batchMaterial
          )
          for (let i = 0, l = hits.length; i < l; i++) {
            const hit = this.convertRaycastIntersect(
              hits[i],
              this as unknown as Object3D,
              raycaster
            ) as ExtendedMeshIntersection
            if (hit) {
              hit.batchObject = this._batchObjects[k]
              intersects.push(hit)
            }
          }
        }
      }
    } else {
      if (this.tas) {
        if (this._batchMaterial === undefined) return

        tmpInverseMatrix.copy(this.matrixWorld).invert()
        ray.copy(raycaster.ray).applyMatrix4(tmpInverseMatrix)
        /** Texts are all quads. Intersecting their BAS is redundant */
        const tasOnly = raycaster.intersectTASOnly || true

        if (raycaster.firstHitOnly === true) {
          const hit = this.convertRaycastIntersect(
            this.tas.raycastFirst(ray, tasOnly, this._batchMaterial),
            this as unknown as Object3D,
            raycaster
          )
          if (hit) {
            intersects.push(hit)
          }
        } else {
          const hits = this.tas.raycast(ray, tasOnly, this._batchMaterial)
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
  }

  /**
   * Update the batched geometry bounds to hold all members
   */
  updateBounds() {
    if (!this._dirty) return
    // Update member local matrices and the overall bounds
    const tempBox3 = new Box3()
    const bbox = (this.geometry.boundingBox ?? new Box3()).makeEmpty()
    this._members.forEach((_, text) => {
      if (text.matrixAutoUpdate) text.updateMatrix() // ignore world matrix
      tempBox3.copy(text.geometry.boundingBox ?? new Box3()).applyMatrix4(text.matrix)
      bbox.union(tempBox3)
    })
    bbox.getBoundingSphere(this.geometry.boundingSphere ?? new Sphere())
  }

  /**
   * @param {Text} text
   */
  addText(text: Text) {
    if (!this._members.has(text)) {
      this._members.set(text, {
        index: -1,
        glyphCount: -1,
        dirty: true,
        needsUpdate: true
      })
      text.addEventListener('synccomplete', this._onMemberSynced)
    }
  }

  private setTexData(texture: DataTexture, index: number, value: number) {
    const texData = texture.image.data
    if (value !== texData[index]) {
      texData[index] = value
      texture.needsUpdate = true
    }
  }

  /*
  Data texture packing strategy:

  # Common:
  0-15: matrix
  16-19: uTroikaTotalBounds
  20-23: uTroikaClipRect
  24: diffuse (color/outlineColor)
  25: uTroikaFillOpacity (fillOpacity/outlineOpacity)
  26: uTroikaCurveRadius
  27: <blank>

  # Main:
  28: uTroikaStrokeWidth
  29: uTroikaStrokeColor
  30: uTroikaStrokeOpacity

  # Outline:
  28-29: uTroikaPositionOffset
  30: uTroikaEdgeOffset
  31: uTroikaBlurRadius
  */

  /**
   * @override
   * Patched version that allows:
   * - Individual text opacities
   * - Coordinate inside gradient/ramp texture <27>
   */
  _prepareForRender(material: SpeckleTextMaterial) {
    if (!this._dirty) return

    this._dirty = false

    const floatsPerMember = 32
    const tempColor = new Color()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const isOutline = material.isTextOutlineMaterial
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    material.uniforms.uTroikaIsOutline.value = isOutline

    // Resize the texture to fit in powers of 2
    let texture = this._dataTextures[isOutline ? 'outline' : 'main']
    const dataLength = Math.pow(
      2,
      Math.ceil(Math.log2(this._members.size * floatsPerMember))
    )
    if (!texture || dataLength !== texture.image.data.length) {
      // console.log(`resizing: ${dataLength}`);
      if (texture) texture.dispose()
      const width = Math.min(dataLength / 4, 1024)
      texture = this._dataTextures[isOutline ? 'outline' : 'main'] = new DataTexture(
        new Float32Array(dataLength),
        width,
        dataLength / 4 / width,
        RGBAFormat,
        FloatType
      )
    }

    this._members.forEach((packingInfo, text) => {
      if (packingInfo.index > -1 && packingInfo.needsUpdate) {
        packingInfo.needsUpdate = false
        const startIndex = packingInfo.index * floatsPerMember

        // Matrix
        const matrix = text.matrix.elements

        for (let i = 0; i < 16; i++) {
          this.setTexData(texture, startIndex + i, matrix[i])
        }
        if (material.defines && material.defines['USE_RTE'] !== undefined) {
          const translation = new Vector3(matrix[12], matrix[13], matrix[14])
          const translationLow = new Vector3()
          const translationHigh = new Vector3()
          Geometry.DoubleToHighLowVector(translation, translationLow, translationHigh)
          this.setTexData(texture, startIndex + 3, translationLow.x)
          this.setTexData(texture, startIndex + 7, translationLow.y)
          this.setTexData(texture, startIndex + 11, translationLow.z)
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
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
        } = material.uniforms

        // Total bounds for uv
        for (let i = 0; i < 4; i++) {
          this.setTexData(
            texture,
            startIndex + 16 + i,
            uTroikaTotalBounds.value.getComponent(i)
          )
        }

        // Clip rect
        for (let i = 0; i < 4; i++) {
          this.setTexData(
            texture,
            startIndex + 20 + i,
            uTroikaClipRect.value.getComponent(i)
          )
        }

        // Color
        let color = isOutline ? text.outlineColor || 0 : text.color
        if (color === null) color = this.color
        if (color === null) color = this.material.color
        if (color === null) color = 0xffffff
        this.setTexData(texture, startIndex + 24, tempColor.set(color).getHex())

        // Fill opacity / outline opacity
        this.setTexData(
          texture,
          startIndex + 25,
          (text.material as Material).opacity ?? uTroikaFillOpacity.value
        )

        // Curve radius
        this.setTexData(texture, startIndex + 26, uTroikaCurveRadius.value)
        // Billboard height
        this.setTexData(texture, startIndex + 27, text.userData.gradientIndex)

        if (isOutline) {
          // Outline properties
          this.setTexData(texture, startIndex + 28, uTroikaPositionOffset.value.x)
          this.setTexData(texture, startIndex + 29, uTroikaPositionOffset.value.y)
          this.setTexData(texture, startIndex + 30, uTroikaEdgeOffset.value)
          this.setTexData(texture, startIndex + 31, uTroikaBlurRadius.value)
        } else {
          // Stroke properties
          this.setTexData(texture, startIndex + 28, uTroikaStrokeWidth.value)
          this.setTexData(
            texture,
            startIndex + 29,
            tempColor.set(uTroikaStrokeColor.value).getHex()
          )
          this.setTexData(texture, startIndex + 30, uTroikaStrokeOpacity.value)
        }
      }
    })
    material.setMatrixTexture(texture)

    // For the non-member-specific uniforms:
    Text.prototype._prepareForRender.call(this, material)
  }
}
