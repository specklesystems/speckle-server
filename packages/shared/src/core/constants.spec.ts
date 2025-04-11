import { describe, expect, it } from 'vitest'
import { AllScopes, isScope } from './constants.js'

describe('Constants', () => {
  describe('isScope', () => {
    it.each(AllScopes)('should be valid for scope %', (scope) => {
      expect(isScope(scope)).toBe(true)
    })
    it('should be invalid for scope', () => {
      expect(isScope('invalid')).toBe(false)
    })
  })
})
