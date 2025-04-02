import { describe, expect, it } from 'vitest'
import { hasEditorSeat } from './workspaceSeat.js'
import { nanoid } from 'nanoid'

describe('hasEditorSeat returns a function, that', () => {
  it('returns false when user has no seats', async () => {
    const result = hasEditorSeat({ getWorkspaceSeat: async () => null })({
      userId: nanoid(10),
      workspaceId: nanoid(10)
    })
    await expect(result).resolves.toBe(false)
  })
  it('returns false when user has non editor seats', async () => {
    const result = hasEditorSeat({ getWorkspaceSeat: async () => 'viewer' })({
      userId: nanoid(10),
      workspaceId: nanoid(10)
    })
    await expect(result).resolves.toBe(false)
  })
  it('returns true when user has editor seats', async () => {
    const result = hasEditorSeat({ getWorkspaceSeat: async () => 'editor' })({
      userId: nanoid(10),
      workspaceId: nanoid(10)
    })
    await expect(result).resolves.toBe(true)
  })
})
