import { BufferGeometry, Material } from 'three'
import { DrawGroup } from './InstancedMeshBatch'
import SpeckleMesh from '../objects/SpeckleMesh'
import { BatchUpdateRange } from './Batch'

export class DrawRanges {
  private groups: DrawGroup[]
  private geometry: BufferGeometry
  private materials: Material[]
  private _flatRanges: number[] = []

  constructor(mesh: SpeckleMesh) {
    this.geometry = mesh.geometry
    this.materials = mesh.material as Material[]
    this._flatRanges.push(0, this.geometry.index.count)
  }

  public integrateRange(range: BatchUpdateRange) {
    const r0 = range.offset
    const r1 = range.offset + range.count
    this._flatRanges.splice(
      this._flatRanges.findIndex((value) => value > r0),
      0,
      r0
    )
    this._flatRanges.splice(
      this._flatRanges.findIndex((value) => value > r1),
      0,
      r1
    )
  }
}
