import { expect, describe, it } from 'vitest'
import { DrawRanges } from '../src/modules/batching/DrawRanges.js'
import SpeckleBasicMaterial from '../src/modules/materials/SpeckleBasicMaterial.js'
import { DrawGroup } from '../src/modules/batching/Batch.js'

const material0 = new SpeckleBasicMaterial({ color: 0xff0000 })
const material1 = new SpeckleBasicMaterial({ color: 0x00ff00 })
const material2 = new SpeckleBasicMaterial({ color: 0x0000ff })

describe('Draw Ranges', () => {
  it('Boundary Ranges', () => {
    const drawRange = new DrawRanges()
    let groups = [
      {
        start: 0,
        count: 2095,
        materialIndex: 0
      } as DrawGroup
    ]
    groups = drawRange.integrateRanges(
      groups,
      [material0, material1],
      [
        {
          offset: 0,
          count: 2095,
          material: material1
        }
      ]
    )
    expect(groups).toMatchSnapshot()

    groups = drawRange.integrateRanges(
      groups,
      [material0, material1],
      [
        {
          offset: 0,
          count: 2094,
          material: material0
        }
      ]
    )
    expect(groups).toMatchSnapshot()

    groups = [
      {
        start: 0,
        count: 2095,
        materialIndex: 0
      } as DrawGroup
    ]
    groups = drawRange.integrateRanges(
      groups,
      [material0, material1],
      [
        {
          offset: 2094,
          count: 1,
          material: material1
        }
      ]
    )
    expect(groups).toMatchSnapshot()
  })

  it('Mixed Ranges', () => {
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

    const drawRange = new DrawRanges()

    groups = drawRange.integrateRanges(
      groups,
      [material0, material1],
      [
        { offset: 36, count: 36, material: material1 },
        {
          offset: 180,
          count: 1395,
          material: material1
        },
        {
          offset: 1581,
          count: 32766,
          material: material1
        }
      ]
    )
    expect(groups).toMatchSnapshot()
  })

  it('Mixed Ranges 2', () => {
    let groups = [
      {
        start: 0,
        count: 528,
        materialIndex: 0
      } as DrawGroup,
      {
        start: 528,
        count: 3261,
        materialIndex: 1
      } as DrawGroup
    ]

    const drawRange = new DrawRanges()

    groups = drawRange.integrateRanges(
      groups,
      [material0, material1, material2],
      [{ offset: 6, count: 36, material: material2 }]
    )
    expect(groups).toMatchSnapshot()
  })

  it('Mixed Ranges 3', () => {
    let groups = [
      {
        start: 0,
        count: 528,
        materialIndex: 0
      } as DrawGroup,
      {
        start: 528,
        count: 3261,
        materialIndex: 1
      } as DrawGroup
    ]

    const drawRange = new DrawRanges()

    groups = drawRange.integrateRanges(
      groups,
      [material0, material1, material2],
      [{ offset: 530, count: 36, material: material2 }]
    )
    expect(groups).toMatchSnapshot()
  })

  it('Multiple Materials', () => {
    const material3 = new SpeckleBasicMaterial({ color: 0x0000ff })
    const material4 = new SpeckleBasicMaterial({ color: 0x0000ff })

    let groups = [
      {
        start: 0,
        count: 216,
        materialIndex: 3
      } as DrawGroup,
      {
        start: 216,
        count: 1323,
        materialIndex: 1
      } as DrawGroup,
      {
        start: 1539,
        count: 540,
        materialIndex: 0
      } as DrawGroup,
      {
        start: 2079,
        count: 32268,
        materialIndex: 2
      } as DrawGroup
    ]

    const drawRange = new DrawRanges()

    groups = drawRange.integrateRanges(
      groups,
      [material0, material1, material2, material3, material4],
      [
        {
          offset: 36,
          count: 257,
          material: material4
        }
      ]
    )
    expect(groups).toMatchSnapshot()
  })
})
