import { Material } from 'three'
import { BatchUpdateRange } from './Batch'
import { DrawGroup } from './InstancedMeshBatch'
export class DrawRanges {
  public integrateRange(
    groups: Array<DrawGroup>,
    materials: Array<Material>,
    range: BatchUpdateRange
  ): Array<DrawGroup> {
    let _flatRanges: Array<number> = []
    let _flatMaterialIndices: Array<number> = []

    groups.sort((a, b) => a.start - b.start)

    const rangeMaterialIndex = materials.indexOf(range.material)
    _flatRanges = groups.map((group: DrawGroup) => {
      return group.start + group.count
    })
    _flatRanges.unshift(0)

    _flatMaterialIndices = groups.map((group: DrawGroup) => {
      return group.materialIndex
    })
    _flatMaterialIndices.unshift(groups[0].materialIndex)

    const r0 = range.offset
    const r0Index = _flatRanges.findIndex((value) => value > r0)
    _flatRanges.splice(r0Index, 0, r0)

    const r1 = range.offset + range.count
    const r1Index = _flatRanges.findIndex((value) => value > r1)
    _flatRanges.splice(r1Index, 0, r1)

    _flatMaterialIndices.splice(r0Index, 0, rangeMaterialIndex)
    // _flatMaterialIndices.splice(
    //   r1Index,
    //   0,
    //   groups.find((value) => value.start + value.count >= r0).materialIndex
    // )

    _flatRanges = _flatRanges.filter((value) => {
      return !(value > r0 && value < r1)
    })
    _flatRanges = [...new Set(_flatRanges)]

    const drawRanges = []
    for (let k = 0; k < _flatRanges.length - 1; k++) {
      if (_flatMaterialIndices[k] === undefined) {
        console.warn('mata')
      }
      drawRanges.push({
        start: _flatRanges[k],
        count: _flatRanges[k + 1] - _flatRanges[k],
        materialIndex: _flatMaterialIndices[k]
      })
    }
    return drawRanges
  }
}
