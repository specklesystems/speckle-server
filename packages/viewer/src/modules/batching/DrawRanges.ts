import { Material } from 'three'
import { type BatchUpdateRange } from './Batch.js'
import { type DrawGroup } from './Batch.js'

export class DrawRanges {
  public integrateRanges(
    groups: Array<DrawGroup>,
    materials: Array<Material>,
    ranges: BatchUpdateRange[]
  ): Array<DrawGroup> {
    let _flatRanges: Array<number> = []
    groups.sort((a, b) => a.start - b.start)
    ranges.sort((a, b) => a.offset - b.offset)

    const edgesForward: { [key: number]: number } = {}
    const edgesBackwards: { [key: number]: number } = {}
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
      const next = _flatRanges[r0Index]
      _flatRanges.splice(r0Index, 0, r0)

      const r1 = range.offset + range.count
      const r1Index = _flatRanges.findIndex((value) => value > r1)
      _flatRanges.splice(r1Index, 0, r1)

      _flatRanges = _flatRanges.filter((value) => {
        return !(value > r0 && value < r1)
      })
      _flatRanges = [...new Set(_flatRanges)]

      const materialIndex = materials.indexOf(range.material as Material)
      edgesForward[r0] = materialIndex
      edgesForward[r1] = r1 >= next ? edgesForward[next] : edgesBackwards[next]
    }

    const drawRanges = []
    let groupStart = -1
    let count = 0
    for (let k = 0; k < _flatRanges.length - 1; k++) {
      const start = _flatRanges[k]
      const end = _flatRanges[k + 1]
      count += end - start
      const materialIndex = edgesForward[start]
      const lastGroup = k === _flatRanges.length - 2
      if (edgesForward[_flatRanges[k + 1]] === materialIndex || lastGroup) {
        if (groupStart === -1) {
          groupStart = start
        }
        if (!lastGroup) continue
      }

      drawRanges.push({
        start: groupStart === -1 ? start : groupStart,
        count,
        materialIndex
      })
      groupStart = -1
      count = 0
    }

    return drawRanges
  }
}
