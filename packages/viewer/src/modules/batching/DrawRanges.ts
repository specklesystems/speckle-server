import { Material } from 'three'
import { BatchUpdateRange } from './Batch'
import { DrawGroup } from './InstancedMeshBatch'

interface DrawRangeEdge {
  start: number
  end: number
  index: number
}

export class DrawRanges {
  public static mapTime: number
  public static findIndexTime: number
  public static filterTime: number
  public static iterationTime: number
  public static findTime: number

  public integrateRange(
    groups: Array<DrawGroup>,
    materials: Array<Material>,
    range: BatchUpdateRange
  ): Array<DrawGroup> {
    let _flatRanges: Array<number> = []
    let _edges: Array<DrawRangeEdge> = []
    const incomingMaterialIndex = materials.indexOf(range.material)
    // groups.sort((a, b) => a.start - b.start)

    let start = performance.now()
    _edges = groups.map((group: DrawGroup) => {
      return {
        start: group.start,
        end: group.start + group.count,
        index: group.materialIndex
      }
    })

    _flatRanges = groups.map((group: DrawGroup) => {
      return group.start + group.count
    })
    _flatRanges.unshift(0)

    DrawRanges.mapTime += performance.now() - start
    start = performance.now()
    const r0 = range.offset
    const r0Index = _flatRanges.findIndex((value) => value > r0)
    _flatRanges.splice(r0Index, 0, r0)

    const r1 = range.offset + range.count
    const r1Index = _flatRanges.findIndex((value) => value > r1)
    _flatRanges.splice(r1Index, 0, r1)

    DrawRanges.findIndexTime += performance.now() - start
    start = performance.now()

    _flatRanges = _flatRanges.filter((value) => {
      return !(value > r0 && value < r1)
    })
    _flatRanges = [...new Set(_flatRanges)]

    DrawRanges.filterTime += performance.now() - start
    start = performance.now()

    const drawRanges = []
    for (let k = 0; k < _flatRanges.length - 1; k++) {
      const start = _flatRanges[k]
      const end = _flatRanges[k + 1]
      const rangeMaterialIndex =
        range.offset === start && range.offset + range.count === end
          ? incomingMaterialIndex
          : null
      const plm = performance.now()
      const edge: DrawRangeEdge = _edges.find(
        (value: DrawRangeEdge) => value.start <= start && value.end >= end
      )
      DrawRanges.findTime += performance.now() - plm
      drawRanges.push({
        start,
        count: end - start,
        materialIndex: rangeMaterialIndex !== null ? rangeMaterialIndex : edge.index
      })
    }
    DrawRanges.iterationTime += performance.now() - start

    return drawRanges
  }
}
