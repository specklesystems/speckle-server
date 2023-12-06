import { Box3, InstancedMesh, Matrix4, Sphere } from 'three'

export class PatchedInstancedMesh extends InstancedMesh {
  public boundingBox: Box3 = null
  public boundingSphere: Sphere = null
  private _instanceLocalMatrix: Matrix4 = new Matrix4()
  private _box3: Box3 = new Box3()
  private _sphere: Sphere = new Sphere()

  computeBoundingBox() {
    const geometry = this.geometry
    const count = this.count

    if (this.boundingBox === null) {
      this.boundingBox = new Box3()
    }

    if (geometry.boundingBox === null) {
      geometry.computeBoundingBox()
    }

    this.boundingBox.makeEmpty()

    for (let i = 0; i < count; i++) {
      this.getMatrixAt(i, this._instanceLocalMatrix)

      this._box3.copy(geometry.boundingBox).applyMatrix4(this._instanceLocalMatrix)

      this.boundingBox.union(this._box3)
    }
  }

  computeBoundingSphere() {
    const geometry = this.geometry
    const count = this.count

    if (this.boundingSphere === null) {
      this.boundingSphere = new Sphere()
    }

    if (geometry.boundingSphere === null) {
      geometry.computeBoundingSphere()
    }

    this.boundingSphere.makeEmpty()

    for (let i = 0; i < count; i++) {
      this.getMatrixAt(i, this._instanceLocalMatrix)

      this._sphere.copy(geometry.boundingSphere).applyMatrix4(this._instanceLocalMatrix)

      this.boundingSphere.union(this._sphere)
    }
  }
}
