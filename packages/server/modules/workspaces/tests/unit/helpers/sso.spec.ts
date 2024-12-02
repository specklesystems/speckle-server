import {
  buildAuthRedirectUrl,
  buildErrorUrl,
  buildFinalizeUrl
} from '@/modules/workspaces/helpers/sso'
import { expect } from 'chai'

describe('buildAuthRedirectUrl', () => {
  it('should include workspace slug provided', () => {
    const url = buildAuthRedirectUrl('my-workspace', false)
    expect(url.toString().includes('my-workspace')).to.equal(true)
  })
  it('should include validate param if provided', () => {
    const url = buildAuthRedirectUrl('my-workspace', true)
    expect(url.searchParams.get('validate')).to.equal('true')
  })
})

describe('buildFinalizeUrl', () => {
  it('should include workspace slug provided', () => {
    const url = buildFinalizeUrl('my-workspace')
    expect(url.toString().includes('my-workspace')).to.equal(true)
  })
})

describe('buildErrorUrl', () => {
  it('should include workspace slug provided', () => {
    const url = buildErrorUrl({}, 'my-workspace')
    expect(url.toString().includes('my-workspace')).to.equal(true)
  })
  it('should include error message provided', () => {
    const url = buildErrorUrl(new Error('test'), 'my-workspace')
    expect(url.toString().includes('error')).to.equal(true)
    expect(url.toString().includes('test')).to.equal(true)
  })
})
