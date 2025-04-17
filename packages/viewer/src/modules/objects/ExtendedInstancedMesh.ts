import { BufferGeometry, InstancedMesh, Material } from 'three'

export class ExtendedInstancedMesh extends InstancedMesh<
  BufferGeometry,
  Material | Material[]
> {
  private _batchIndex: number

  public constructor(
    geometry: BufferGeometry | undefined,
    material: Material | Material[] | undefined,
    count: number,
    batchIndex: number
  ) {
    super(geometry, material, count)
    this._batchIndex = batchIndex
  }

  public get batchIndex(): number {
    return this._batchIndex
  }
}
