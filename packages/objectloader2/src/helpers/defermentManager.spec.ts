/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any  */
import { describe, expect, test } from 'vitest'
import { DefermentManager } from './defermentManager.js'

describe('deferments', () => {
  test('defer one', async () => {
    const deferments = new DefermentManager({ maxSizeInMb: 1, ttlms: 1 })
    const x = deferments.defer({ id: 'id' })
    expect(x).toBeInstanceOf(Promise)
    deferments.undefer({ baseId: 'id', base: { id: 'id', speckle_type: 'type' } })
    const b = await x
    expect(b).toMatchSnapshot()
  })

  test('expireAt timeout', async () => {
    const now = 1
    const deferments = new DefermentManager({ maxSizeInMb: 1, ttlms: 1 })
    deferments['now'] = (): number => now
    const x = deferments.defer({ id: 'id' })
    expect(x).toBeInstanceOf(Promise)
    const d = deferments.get('id')
    expect(d).toBeDefined()
    expect(d?.getId()).toBe('id')
    expect((d as any).expiresAt).toBe(2)
    expect((d as any).ttl).toBe(1)
    expect((d as any).item).toBeUndefined()
    expect(d?.isExpired(1)).toBe(false)
    deferments.undefer({ baseId: 'id', base: { id: 'id', speckle_type: 'type' } })
    await x
    expect((d as any).expiresAt).toBe(2)
    expect((d as any).ttl).toBe(1)
    expect((d as any).item).toBeDefined()
    expect(d?.isExpired(1)).toBe(false)
    expect(d?.isExpired(3)).toBe(true)
  })
})
