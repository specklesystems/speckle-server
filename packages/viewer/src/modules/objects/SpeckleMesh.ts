import {
  BackSide,
  Box3,
  BufferAttribute,
  BufferGeometry,
  DataTexture,
  DoubleSide,
  FloatType,
  Material,
  Matrix4,
  Mesh,
  Object3D,
  Ray,
  Raycaster,
  RGBAFormat,
  SkinnedMesh,
  Sphere,
  Triangle,
  Vector2,
  Vector3,
  type Intersection
} from 'three'
import { BatchObject } from '../batching/BatchObject.js'
import Materials from '../materials/Materials.js'
import { TopLevelAccelerationStructure } from './TopLevelAccelerationStructure.js'
import { SpeckleRaycaster } from './SpeckleRaycaster.js'
import Logger from '../utils/Logger.js'

const _inverseMatrix = new Matrix4()
const _ray = new Ray()
const _sphere = new Sphere()
const _vTemp = new Vector3()
const _vA = new Vector3()
const _vB = new Vector3()
const _vC = new Vector3()

const _tempA = new Vector3()
const _tempB = new Vector3()
const _tempC = new Vector3()

const _morphA = new Vector3()
const _morphB = new Vector3()
const _morphC = new Vector3()

const _uvA = new Vector2()
const _uvB = new Vector2()
const _uvC = new Vector2()

const _intersectionPoint = new Vector3()
const _intersectionPointWorld = new Vector3()

const ray = /* @__PURE__ */ new Ray()
const tmpInverseMatrix = /* @__PURE__ */ new Matrix4()

export enum TransformStorage {
  VERTEX_TEXTURE = 0,
  UNIFORM_ARRAY = 1
}

export default class SpeckleMesh extends Mesh {
  public static MeshBatchNumber = 0

  private tas: TopLevelAccelerationStructure
  private batchMaterial: Material
  private materialCache: { [id: string]: Material } = {}
  private materialStack: Array<Material | Material[]> = []
  private batchMaterialStack: Array<Material> = []
  private materialCacheLUT: { [id: string]: number } = {}

  private _batchObjects!: BatchObject[]
  private transformsBuffer: Float32Array | undefined = undefined
  private transformStorage!: TransformStorage

  public transformsTextureUniform: DataTexture
  public transformsArrayUniforms: Matrix4[] | null = null

  public get TAS(): TopLevelAccelerationStructure {
    return this.tas
  }

  public get batchObjects(): BatchObject[] {
    return this._batchObjects
  }

  constructor(geometry: BufferGeometry) {
    super(geometry)
  }

  public setBatchMaterial(material: Material) {
    this.batchMaterial = this.getCachedMaterial(material)
    this.material = [this.batchMaterial]
  }

  public setBatchObjects(
    batchObjects: BatchObject[],
    transformStorage: TransformStorage
  ) {
    this._batchObjects = batchObjects
    this.transformStorage = transformStorage

    if (this.transformStorage === TransformStorage.VERTEX_TEXTURE) {
      this.transformsBuffer = new Float32Array(this._batchObjects.length * 4 * 4)
      this.transformsTextureUniform = new DataTexture(
        this.transformsBuffer,
        this.transformsBuffer.length / 4,
        1,
        RGBAFormat,
        FloatType
      )
    } else if (this.transformStorage === TransformStorage.UNIFORM_ARRAY) {
      this.transformsArrayUniforms = this._batchObjects.map(() => new Matrix4())
    }
    this.updateTransformsUniform()
  }

  public setOverrideMaterial(material: Material) {
    this.materialStack.push(this.material)

    this.material = this.getCachedMaterial(material, true)
    this.material.needsUpdate = true
  }

  public setOverrideBatchMaterial(material: Material) {
    const overrideMaterial = this.getCachedMaterial(material, true)
    this.batchMaterialStack.push(overrideMaterial)
    const materials = this.material as Array<Material>
    for (let k = 0; k < materials.length; k++) {
      if (materials[k].uuid === this.batchMaterial.uuid) {
        materials[k] = overrideMaterial
      }
    }
  }

  public restoreBatchMaterial() {
    const materials = this.material as Array<Material>
    const overrideBatchMaterial = this.batchMaterialStack.pop()
    if (!overrideBatchMaterial) return

    for (let k = 0; k < materials.length; k++) {
      if (materials[k].uuid === overrideBatchMaterial.uuid) {
        materials[k] = this.batchMaterial
      }
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
      const clone = material.clone()
      this.materialCache[material.id] = clone
      this.materialCacheLUT[clone.id] = material.id
      cachedMaterial = clone
      this.updateMaterialTransformsUniform(this.materialCache[material.id])
    } else if (
      copy ||
      (material as never)['needsCopy'] ||
      (cachedMaterial as never)['needsCopy']
    ) {
      Materials.fastCopy(material, cachedMaterial)
    }
    return cachedMaterial
  }

  public restoreMaterial() {
    if (this.materialStack.length > 0)
      this.material = this.materialStack.pop() as Material | Material[]
  }

  public updateMaterialTransformsUniform(material: Material) {
    if (!material.defines) material.defines = {}
    material.defines['TRANSFORM_STORAGE'] = this.transformStorage

    if (this.transformStorage === TransformStorage.VERTEX_TEXTURE) {
      material.userData.tTransforms.value = this.transformsTextureUniform
      if (material.userData.objCount)
        material.userData.objCount.value = this._batchObjects.length
    } else if (this.transformStorage === TransformStorage.UNIFORM_ARRAY) {
      if (
        !material.defines['OBJ_COUNT'] ||
        material.defines['OBJ_COUNT'] !== this._batchObjects.length
      ) {
        material.defines['OBJ_COUNT'] = this._batchObjects.length
      }
      material.userData.uTransforms.value = this.transformsArrayUniforms
    }

    material.needsUpdate = true
  }

  public updateTransformsUniform() {
    if (!this.transformsBuffer) return
    let needsUpdate = false
    if (this.transformStorage === TransformStorage.VERTEX_TEXTURE) {
      for (let k = 0; k < this._batchObjects.length; k++) {
        const batchObject = this._batchObjects[k]
        if (!(needsUpdate ||= batchObject.transformDirty)) continue

        const index = batchObject.batchIndex * 16
        this.transformsBuffer[index] = batchObject.quaternion.x
        this.transformsBuffer[index + 1] = batchObject.quaternion.y
        this.transformsBuffer[index + 2] = batchObject.quaternion.z
        this.transformsBuffer[index + 3] = batchObject.quaternion.w

        this.transformsBuffer[index + 4] = batchObject.pivot_Low.x
        this.transformsBuffer[index + 5] = batchObject.pivot_Low.y
        this.transformsBuffer[index + 6] = batchObject.pivot_Low.z
        this.transformsBuffer[index + 7] = batchObject.scaleValue.x

        this.transformsBuffer[index + 8] = batchObject.pivot_High.x
        this.transformsBuffer[index + 9] = batchObject.pivot_High.y
        this.transformsBuffer[index + 10] = batchObject.pivot_High.z
        this.transformsBuffer[index + 11] = batchObject.scaleValue.y

        this.transformsBuffer[index + 12] = batchObject.translation.x
        this.transformsBuffer[index + 13] = batchObject.translation.y
        this.transformsBuffer[index + 14] = batchObject.translation.z
        this.transformsBuffer[index + 15] = batchObject.scaleValue.z

        batchObject.transformDirty = false
      }
      this.transformsTextureUniform.needsUpdate = needsUpdate
    } else {
      if (!this.transformsArrayUniforms) return
      for (let k = 0; k < this._batchObjects.length; k++) {
        const batchObject = this._batchObjects[k]
        if (!(needsUpdate ||= batchObject.transformDirty)) continue

        this.transformsArrayUniforms[k].set(
          batchObject.quaternion.x,
          batchObject.pivot_Low.x,
          batchObject.pivot_High.x,
          batchObject.translation.x,
          batchObject.quaternion.y,
          batchObject.pivot_Low.y,
          batchObject.pivot_High.y,
          batchObject.translation.y,
          batchObject.quaternion.z,
          batchObject.pivot_Low.z,
          batchObject.pivot_High.z,
          batchObject.translation.z,
          batchObject.quaternion.w,
          batchObject.scaleValue.x,
          batchObject.scaleValue.y,
          batchObject.scaleValue.z
        )
      }
    }
    if (this.tas && needsUpdate) {
      this.tas.refit()
      this.tas.getBoundingBox(this.tas.bounds)
      /** Caterint to typescript
       *  There is no unniverse where the geomery bounding box/sphere is null at this point
       */
      if (!this.geometry.boundingBox) this.geometry.boundingBox = new Box3()
      this.geometry.boundingBox.copy(this.tas.bounds)
      if (!this.geometry.boundingSphere) this.geometry.boundingSphere = new Sphere()
      this.geometry.boundingBox.getBoundingSphere(this.geometry.boundingSphere)
    }
  }

  public buildTAS() {
    this.tas = new TopLevelAccelerationStructure(this.batchObjects)
    /** We do a refit here, because for some reason the bvh library incorrectly computes the total bvh bounds at creation,
     *  so we force a refit in order to get the proper bounds value out of it
     */
    this.tas.refit()
  }

  public getBatchObjectMaterial(batchObject: BatchObject) {
    const rv = batchObject.renderView
    const group = this.geometry.groups.find((value) => {
      return (
        rv.batchStart >= value.start &&
        rv.batchStart + rv.batchCount <= value.count + value.start
      )
    })
    if (!Array.isArray(this.material)) {
      return this.material
    } else {
      if (!group) {
        Logger.warn(
          `Could not get material for ${batchObject.renderView.renderData.id}`
        )
        return null
      }
      return this.material[group.materialIndex as number]
    }
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

  raycast(raycaster: SpeckleRaycaster, intersects: Array<Intersection>) {
    if (this.tas) {
      if (this.batchMaterial === undefined) return

      tmpInverseMatrix.copy(this.matrixWorld).invert()
      ray.copy(raycaster.ray).applyMatrix4(tmpInverseMatrix)

      if (raycaster.firstHitOnly === true) {
        const hit = this.convertRaycastIntersect(
          this.tas.raycastFirst(ray, raycaster.intersectTASOnly, this.batchMaterial),
          this,
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
          const hit = this.convertRaycastIntersect(hits[i], this, raycaster)
          if (hit) {
            intersects.push(hit)
          }
        }
      }
    } else {
      const geometry = this.geometry
      const material = this.material
      const matrixWorld = this.matrixWorld

      if (material === undefined) return

      // Checking boundingSphere distance to ray

      if (geometry.boundingSphere === null) geometry.computeBoundingSphere()

      _sphere.copy(geometry.boundingSphere || new Sphere())
      _sphere.applyMatrix4(matrixWorld)

      if (raycaster.ray.intersectsSphere(_sphere) === false) return

      //

      _inverseMatrix.copy(matrixWorld).invert()
      _ray.copy(raycaster.ray).applyMatrix4(_inverseMatrix)

      // Check boundingBox before continuing

      if (geometry.boundingBox !== null) {
        if (_ray.intersectsBox(geometry.boundingBox) === false) return
      }

      let intersection

      const index = geometry.index
      /** Stored high component if RTE is being used. Regular positions otherwise */
      const position = geometry.attributes.position as BufferAttribute
      /** Stored low component if RTE is being used. undefined otherwise */
      const positionLow = geometry.attributes['position_low'] as BufferAttribute
      const morphPosition = geometry.morphAttributes.position as Array<BufferAttribute>
      const morphTargetsRelative = geometry.morphTargetsRelative
      const uv = geometry.attributes.uv as BufferAttribute
      const uv2 = geometry.attributes.uv2 as BufferAttribute
      const groups = geometry.groups
      const drawRange = geometry.drawRange

      if (index !== null) {
        // indexed buffer geometry

        if (Array.isArray(material)) {
          for (let i = 0, il = groups.length; i < il; i++) {
            const group = groups[i]
            if (!group.materialIndex) {
              Logger.error(`Group with no material, skipping!`)
              continue
            }
            const groupMaterial = material[group.materialIndex]

            const start = Math.max(group.start, drawRange.start)
            const end = Math.min(
              index.count,
              Math.min(group.start + group.count, drawRange.start + drawRange.count)
            )

            for (let j = start, jl = end; j < jl; j += 3) {
              const a = index.getX(j)
              const b = index.getX(j + 1)
              const c = index.getX(j + 2)

              intersection = checkBufferGeometryIntersection(
                this,
                groupMaterial,
                raycaster,
                _ray,
                positionLow,
                position,
                morphPosition,
                morphTargetsRelative,
                uv,
                uv2,
                a,
                b,
                c
              )

              if (intersection) {
                intersection.faceIndex = Math.floor(j / 3) // triangle number in indexed buffer semantics
                if (intersection.face)
                  intersection.face.materialIndex = group.materialIndex
                intersects.push(intersection)
              }
            }
          }
        } else {
          const start = Math.max(0, drawRange.start)
          const end = Math.min(index.count, drawRange.start + drawRange.count)

          for (let i = start, il = end; i < il; i += 3) {
            const a = index.getX(i)
            const b = index.getX(i + 1)
            const c = index.getX(i + 2)

            intersection = checkBufferGeometryIntersection(
              this,
              material,
              raycaster,
              _ray,
              positionLow,
              position,
              morphPosition,
              morphTargetsRelative,
              uv,
              uv2,
              a,
              b,
              c
            )

            if (intersection) {
              intersection.faceIndex = Math.floor(i / 3) // triangle number in indexed buffer semantics
              intersects.push(intersection)
            }
          }
        }
      } else if (position !== undefined) {
        // non-indexed buffer geometry

        if (Array.isArray(material)) {
          for (let i = 0, il = groups.length; i < il; i++) {
            const group = groups[i]
            const groupMaterial = material[group.materialIndex as number]

            const start = Math.max(group.start, drawRange.start)
            const end = Math.min(
              position.count,
              Math.min(group.start + group.count, drawRange.start + drawRange.count)
            )

            for (let j = start, jl = end; j < jl; j += 3) {
              const a = j
              const b = j + 1
              const c = j + 2

              intersection = checkBufferGeometryIntersection(
                this,
                groupMaterial,
                raycaster,
                _ray,
                positionLow,
                position,
                morphPosition,
                morphTargetsRelative,
                uv,
                uv2,
                a,
                b,
                c
              )

              if (intersection) {
                intersection.faceIndex = Math.floor(j / 3) // triangle number in non-indexed buffer semantics
                if (intersection.face)
                  intersection.face.materialIndex = group.materialIndex as number
                intersects.push(intersection)
              }
            }
          }
        } else {
          const start = Math.max(0, drawRange.start)
          const end = Math.min(position.count, drawRange.start + drawRange.count)

          for (let i = start, il = end; i < il; i += 3) {
            const a = i
            const b = i + 1
            const c = i + 2

            intersection = checkBufferGeometryIntersection(
              this,
              material,
              raycaster,
              _ray,
              positionLow,
              position,
              morphPosition,
              morphTargetsRelative,
              uv,
              uv2,
              a,
              b,
              c
            )

            if (intersection) {
              intersection.faceIndex = Math.floor(i / 3) // triangle number in non-indexed buffer semantics
              intersects.push(intersection)
            }
          }
        }
      }
    }
  }
}

function checkIntersection(
  object: Object3D,
  material: Material,
  raycaster: Raycaster,
  ray: Ray,
  pA: Vector3,
  pB: Vector3,
  pC: Vector3,
  point: Vector3
): (Intersection & { uv2: Vector2 | undefined }) | null {
  let intersect

  if (material.side === BackSide) {
    intersect = ray.intersectTriangle(pC, pB, pA, true, point)
  } else {
    intersect = ray.intersectTriangle(pA, pB, pC, material.side !== DoubleSide, point)
  }

  if (intersect === null) return null

  _intersectionPointWorld.copy(point)
  _intersectionPointWorld.applyMatrix4(object.matrixWorld)

  const distance = raycaster.ray.origin.distanceTo(_intersectionPointWorld)

  if (distance < raycaster.near || distance > raycaster.far) return null

  return {
    distance,
    point: _intersectionPointWorld.clone(),
    object,
    uv: undefined,
    uv2: undefined,
    face: undefined
  }
}

/** If the geometry is non double->2floats encoded, the `positionHigh` argument will actually
 *  hold the default `position` attribute values
 */
function checkBufferGeometryIntersection(
  object: Object3D,
  material: Material,
  raycaster: Raycaster,
  ray: Ray,
  positionLow: BufferAttribute,
  positionHigh: BufferAttribute,
  morphPosition: Array<BufferAttribute>,
  morphTargetsRelative: boolean,
  uv: BufferAttribute,
  uv2: BufferAttribute,
  a: number,
  b: number,
  c: number
) {
  _vA.fromBufferAttribute(positionHigh, a)
  _vB.fromBufferAttribute(positionHigh, b)
  _vC.fromBufferAttribute(positionHigh, c)
  if (positionLow) {
    _vA.add(_vTemp.fromBufferAttribute(positionLow, a))
    _vB.add(_vTemp.fromBufferAttribute(positionLow, b))
    _vC.add(_vTemp.fromBufferAttribute(positionLow, c))
  }

  const morphInfluences = (object as SkinnedMesh).morphTargetInfluences

  if (morphPosition && morphInfluences) {
    _morphA.set(0, 0, 0)
    _morphB.set(0, 0, 0)
    _morphC.set(0, 0, 0)

    for (let i = 0, il = morphPosition.length; i < il; i++) {
      const influence = morphInfluences[i]
      const morphAttribute = morphPosition[i]

      if (influence === 0) continue

      _tempA.fromBufferAttribute(morphAttribute, a)
      _tempB.fromBufferAttribute(morphAttribute, b)
      _tempC.fromBufferAttribute(morphAttribute, c)

      if (morphTargetsRelative) {
        _morphA.addScaledVector(_tempA, influence)
        _morphB.addScaledVector(_tempB, influence)
        _morphC.addScaledVector(_tempC, influence)
      } else {
        _morphA.addScaledVector(_tempA.sub(_vA), influence)
        _morphB.addScaledVector(_tempB.sub(_vB), influence)
        _morphC.addScaledVector(_tempC.sub(_vC), influence)
      }
    }

    _vA.add(_morphA)
    _vB.add(_morphB)
    _vC.add(_morphC)
  }

  if ((object as SkinnedMesh).isSkinnedMesh) {
    ;(object as SkinnedMesh).boneTransform(a, _vA)
    ;(object as SkinnedMesh).boneTransform(b, _vB)
    ;(object as SkinnedMesh).boneTransform(c, _vC)
  }

  const intersection = checkIntersection(
    object,
    material,
    raycaster,
    ray,
    _vA,
    _vB,
    _vC,
    _intersectionPoint
  )

  if (intersection) {
    if (uv) {
      _uvA.fromBufferAttribute(uv, a)
      _uvB.fromBufferAttribute(uv, b)
      _uvC.fromBufferAttribute(uv, c)

      intersection.uv = Triangle.getUV(
        _intersectionPoint,
        _vA,
        _vB,
        _vC,
        _uvA,
        _uvB,
        _uvC,
        new Vector2()
      )
    }

    if (uv2) {
      _uvA.fromBufferAttribute(uv2, a)
      _uvB.fromBufferAttribute(uv2, b)
      _uvC.fromBufferAttribute(uv2, c)

      intersection.uv2 = Triangle.getUV(
        _intersectionPoint,
        _vA,
        _vB,
        _vC,
        _uvA,
        _uvB,
        _uvC,
        new Vector2()
      )
    }

    const face = {
      a,
      b,
      c,
      normal: new Vector3(),
      materialIndex: 0
    }

    Triangle.getNormal(_vA, _vB, _vC, face.normal)

    intersection.face = face
  }

  return intersection
}
