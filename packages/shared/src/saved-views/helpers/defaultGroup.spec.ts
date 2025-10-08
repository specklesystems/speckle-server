import { describe, expect, it } from 'vitest'
import { isUngroupedGroup } from './defaultGroup.js'

describe('isUngroupedGroup', () => {
  it('should return true for ungrouped groups', () => {
    expect(isUngroupedGroup('default-group')).toBe(true)
  })

  it('should return false for grouped groups', () => {
    expect(isUngroupedGroup('custom-group')).toBe(false)
  })
})
