import { describe, expect, test } from 'vitest'
import ObjectLoader2 from './operations/objectLoader2.js'

describe('random test examples', () => {
  test('run fine', () => {
    const loader = new ObjectLoader2('a', 'b', 'c')
    expect(loader).to.be.ok
  })
})
