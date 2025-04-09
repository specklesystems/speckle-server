import { describe, expect, test } from 'vitest'
import { DefermentManager } from './defermentManager.js'

describe('deferments', () => {
  test('defer one', async () => {
    const deferments = new DefermentManager()
    const x = deferments.defer({ id: 'id' })
    expect(x).toBeInstanceOf(Promise)
    deferments.undefer({ baseId: 'id', base: { id: 'id' } })
    const b = await x
    expect(b).toBeDefined()
    expect(b.id).toBe('id')
  })
})
