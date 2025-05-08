import { describe, expect, test } from 'vitest'
import { DefermentManager } from './defermentManager.js'

describe('deferments', () => {
  test('defer one', async () => {
    const deferments = new DefermentManager({ maxSize: 1, ttl: 1 })
    const x = deferments.defer({ id: 'id' })
    expect(x).toBeInstanceOf(Promise)
    deferments.undefer({ baseId: 'id', base: { id: 'id', speckle_type: 'type' } })
    const b = await x
    expect(b).toMatchSnapshot()
  })
})
