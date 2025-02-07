import { expect } from 'chai'
import { calculateObjectHash } from '@/modules/core/services/objects/management'

describe('object hash @core', () => {
  describe('calculates the object hash', () => {
    it('ignores the presence of any existing id', async () => {
      expect(calculateObjectHash({ id: '123', name: 'test' })).to.not.equal('123')
    })
    it('is the same id whether the existing id is empty or not present', async () => {
      expect(calculateObjectHash({ name: 'test' })).to.equal(
        calculateObjectHash({ id: '', name: 'test' })
      )
    })
  })
})
