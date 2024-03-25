import { expect, describe, it } from 'vitest'
import { DrawRanges } from '../src/modules/batching/DrawRanges'
import SpeckleBasicMaterial from '../src/modules/materials/SpeckleBasicMaterial'
import { DrawGroup } from '../src/modules/batching/InstancedMeshBatch'

describe('Draw Ranges', () => {
  let groups = [
    {
      start: 0,
      count: 216,
      materialIndex: 0
    } as DrawGroup,
    {
      start: 216,
      count: 1323,
      materialIndex: 0
    } as DrawGroup,
    {
      start: 1539,
      count: 540,
      materialIndex: 0
    } as DrawGroup,
    {
      start: 2079,
      count: 32268,
      materialIndex: 0
    } as DrawGroup
  ]

  const material0 = new SpeckleBasicMaterial({ color: 0xff0000 })
  const material1 = new SpeckleBasicMaterial({ color: 0x00ff00 })

  const drawRange = new DrawRanges()
  it('draw-ranges-1', () => {
    groups = drawRange.integrateRange(groups, [material0, material1], {
      offset: 36,
      count: 36,
      material: material1
    })
    expect(groups).toMatchSnapshot()
  })

  it('draw-ranges-2', () => {
    groups = drawRange.integrateRange(groups, [material0, material1], {
      offset: 180,
      count: 1395,
      material: material1
    })
    expect(groups).toMatchSnapshot()
  })

  it('draw-ranges-3', () => {
    groups = drawRange.integrateRange(groups, [material0, material1], {
      offset: 1581,
      count: 32766,
      material: material1
    })
    expect(groups).toMatchSnapshot()
  })

  // console.log(groups)
})
