import {
  buildAuthRedirectUrl,
  buildAuthFinalizeRedirectUrl,
  buildAuthErrorRedirectUrl,
  buildValidationErrorRedirectUrl
} from '@/modules/workspaces/helpers/sso'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

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

describe('buildAuthFinalizeRedirectUrl', () => {
  it('should include workspace slug provided', () => {
    const url = buildAuthFinalizeRedirectUrl('my-workspace')
    expect(url.toString().includes('my-workspace')).to.equal(true)
  })
  it('should include provided params', () => {
    const url = buildAuthFinalizeRedirectUrl('my-workspace', { foo: 'bar' })
    expect(url.toString().includes('foo')).to.equal(true)
  })
})

describe('buildAuthErrorRedirectUrl', () => {
  it('should include workspace slug provided', () => {
    const url = buildAuthErrorRedirectUrl('my-workspace', 'Test error message')
    expect(url.toString().includes('my-workspace')).to.equal(true)
  })
  it('should include error message provided', () => {
    const url = buildAuthErrorRedirectUrl('my-workspace', 'Test error message')
    expect(url.toString().includes('ssoError')).to.equal(true)
  })
})

describe('buildValidationErrorRedirectUrl', () => {
  it('should include workspace slug provided', () => {
    const url = buildValidationErrorRedirectUrl('my-workspace', 'Test error message')
    expect(url.toString().includes('my-workspace')).to.equal(true)
  })
  it('should flag the Svalidation flow attempt as failed', () => {
    const url = buildValidationErrorRedirectUrl('my-workspace', 'Test error message')
    expect(url.toString().includes('ssoValidationSuccess=false')).to.equal(true)
  })
  it('should include error message provided', () => {
    const url = buildValidationErrorRedirectUrl('my-workspace', 'Test error message')
    expect(url.toString().includes('ssoError')).to.equal(true)
  })
  it('should include provider data, if present', () => {
    const url = buildValidationErrorRedirectUrl('my-workspace', 'Test error message', {
      providerName: 'My SSO Provider',
      clientId: 'my-sso-provider',
      clientSecret: cryptoRandomString({ length: 9 }),
      issuerUrl: 'https://example.org'
    })
    expect(url.toString().includes('providerName')).to.equal(true)
  })
  it('should omit the client secret from provider data, if present', () => {
    const url = buildValidationErrorRedirectUrl('my-workspace', 'Test error message', {
      providerName: 'My SSO Provider',
      clientId: 'my-sso-provider',
      clientSecret: cryptoRandomString({ length: 9 }),
      issuerUrl: 'https://example.org'
    })
    expect(url.toString().includes('clientSecret')).to.equal(false)
  })
})
