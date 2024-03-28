import { Material } from 'three'
import { BatchUpdateRange } from './Batch'
import { DrawGroup } from './InstancedMeshBatch'

export class DrawRanges {
  public static mapTime: number
  public static findIndexTime: number
  public static filterTime: number
  public static iterationTime: number
  public static findTime: number
  public static callCount: number

  public integrateRange(
    groups: Array<DrawGroup>,
    materials: Array<Material>,
    range: BatchUpdateRange
  ): Array<DrawGroup> {
    let _flatRanges: Array<number> = []
    const incomingMaterialIndex = materials.indexOf(range.material)
    groups.sort((a, b) => a.start - b.start)

    const edgesForward = {}
    const edgesBackwards = {}
    for (let k = 0, l = groups.length - 1; k < groups.length; k++, l--) {
      const groupForward = groups[k]
      const groupBackwards = groups[l]
      edgesForward[groupForward.start] = groupForward.materialIndex
      edgesBackwards[groupBackwards.start + groupBackwards.count] =
        groupBackwards.materialIndex
    }

    _flatRanges = groups.map((group: DrawGroup) => {
      return group.start + group.count
    })
    _flatRanges.unshift(0)

    const r0 = range.offset
    const r0Index = _flatRanges.findIndex((value) => value > r0)
    _flatRanges.splice(r0Index, 0, r0)

    const r1 = range.offset + range.count
    const r1Index = _flatRanges.findIndex((value) => value > r1)
    _flatRanges.splice(r1Index, 0, r1)

    _flatRanges = _flatRanges.filter((value) => {
      return !(value > r0 && value < r1)
    })
    _flatRanges = [...new Set(_flatRanges)]

    const drawRanges = []
    for (let k = 0; k < _flatRanges.length - 1; k++) {
      const start = _flatRanges[k]
      const end = _flatRanges[k + 1]
      const rangeMaterialIndex =
        range.offset === start && range.offset + range.count === end
          ? incomingMaterialIndex
          : null

      const edgeIndex =
        edgesForward[start] !== undefined
          ? edgesForward[start]
          : edgesBackwards[end] !== undefined
          ? edgesBackwards[end]
          : null
      drawRanges.push({
        start,
        count: end - start,
        materialIndex: rangeMaterialIndex !== null ? rangeMaterialIndex : edgeIndex
      })
    }

    return drawRanges
  }

  public integrateRanges(
    groups: Array<DrawGroup>,
    materials: Array<Material>,
    ranges: BatchUpdateRange[]
  ): Array<DrawGroup> {
    let _flatRanges: Array<number> = []
    // const incomingMaterialIndex = 1 //materials.indexOf(range.material)
    groups.sort((a, b) => a.start - b.start)

    const edgesForward = {}
    const edgesBackwards = {}
    for (let k = 0, l = groups.length - 1; k < groups.length; k++, l--) {
      const groupForward = groups[k]
      const groupBackwards = groups[l]
      edgesForward[groupForward.start] = groupForward.materialIndex
      edgesBackwards[groupBackwards.start + groupBackwards.count] =
        groupBackwards.materialIndex
    }

    _flatRanges = groups.map((group: DrawGroup) => {
      return group.start + group.count
    })
    _flatRanges.unshift(0)

    for (let k = 0; k < ranges.length; k++) {
      const range = ranges[k]
      const r0 = range.offset
      const r0Index = _flatRanges.findIndex((value) => value > r0)
      _flatRanges.splice(r0Index, 0, r0)

      const r1 = range.offset + range.count
      const r1Index = _flatRanges.findIndex((value) => value > r1)
      _flatRanges.splice(r1Index, 0, r1)

      _flatRanges = _flatRanges.filter((value) => {
        return !(value > r0 && value < r1)
      })
      _flatRanges = [...new Set(_flatRanges)]
    }

    const drawRanges = []
    for (let k = 0; k < _flatRanges.length - 1; k++) {
      const start = _flatRanges[k]
      const end = _flatRanges[k + 1]
      // const rangeMaterialIndex =
      //   range.offset === start && range.offset + range.count === end
      //     ? incomingMaterialIndex
      //     : null

      // const edgeIndex =
      //   edgesForward[start] !== undefined
      //     ? edgesForward[start]
      //     : edgesBackwards[end] !== undefined
      //     ? edgesBackwards[end]
      //     : null
      drawRanges.push({
        start,
        count: end - start,
        materialIndex: 1
      })
    }

    return drawRanges
  }
}
