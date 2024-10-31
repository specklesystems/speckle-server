import type { LicenseTokenClaims } from '@/modules/gatekeeper/domain/types'
import { validateLicenseModuleAccess } from '@/modules/gatekeeper/services/validateLicense'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import * as jose from 'jose'

describe('validateLicense @gatekeeper', () => {
  describe('validateLicenseModuleAccess', () => {
    it('fails is the token is giberish', async () => {
      const alg = 'RS256'
      const { publicKey } = await jose.generateKeyPair(alg)

      const result = await validateLicenseModuleAccess({
        licenseToken: cryptoRandomString({ length: 32 }),
        canonicalUrl: 'https://example.com',
        publicKey,
        requiredModules: ['workspaces']
      })

      expect(result).to.be.false
    })
    it('fails if the token is signed by another private key', async () => {
      const canonicalUrl = 'https://example.com'
      const alg = 'RS256'

      const { publicKey } = await jose.generateKeyPair(alg)

      const claims: LicenseTokenClaims = {
        allowedDomains: [canonicalUrl],
        enabledModules: {
          workspaces: true
        }
      }

      const { privateKey } = await jose.generateKeyPair(alg)

      const licenseToken = await new jose.SignJWT(claims)
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .sign(privateKey)

      const result = await validateLicenseModuleAccess({
        licenseToken,
        canonicalUrl,
        publicKey,
        requiredModules: ['workspaces']
      })

      expect(result).to.be.false
    })
    it('fails if the token is not in the correct payload format', async () => {
      const canonicalUrl = 'https://example.com'
      const alg = 'RS256'

      const { privateKey, publicKey } = await jose.generateKeyPair(alg)

      const claims = {
        enabledModules: {
          workspaces: true
        }
      }

      const licenseToken = await new jose.SignJWT(claims)
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .sign(privateKey)

      const result = await validateLicenseModuleAccess({
        licenseToken,
        canonicalUrl,
        publicKey,
        requiredModules: ['workspaces']
      })

      expect(result).to.be.false
    })
    it('fails if the token domain claim does not include the canonicalUrl', async () => {
      const canonicalUrl = 'https://example.com'
      const alg = 'RS256'

      const { privateKey, publicKey } = await jose.generateKeyPair(alg)

      const claims: LicenseTokenClaims = {
        allowedDomains: ['https://not.allowed'],
        enabledModules: {
          workspaces: true
        }
      }

      const licenseToken = await new jose.SignJWT(claims)
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .sign(privateKey)

      const result = await validateLicenseModuleAccess({
        licenseToken,
        canonicalUrl,
        publicKey,
        requiredModules: ['workspaces']
      })

      expect(result).to.be.false
    })
    it('fails if the token module claims do not enable all the required modules', async () => {
      const canonicalUrl = 'https://example.com'
      const alg = 'RS256'

      const { privateKey, publicKey } = await jose.generateKeyPair(alg)

      const claims: LicenseTokenClaims = {
        allowedDomains: [canonicalUrl],
        enabledModules: {
          workspaces: false
        }
      }

      const licenseToken = await new jose.SignJWT(claims)
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .sign(privateKey)

      const result = await validateLicenseModuleAccess({
        licenseToken,
        canonicalUrl,
        publicKey,
        requiredModules: ['workspaces', 'gatekeeper']
      })

      expect(result).to.be.false
    })
    it('fails if the token string is tampered with', async () => {
      const canonicalUrl = 'https://example.com'
      const alg = 'RS256'

      const { privateKey, publicKey } = await jose.generateKeyPair(alg)

      const claims: LicenseTokenClaims = {
        allowedDomains: [canonicalUrl],
        enabledModules: {
          workspaces: true
        }
      }

      const licenseToken = await new jose.SignJWT(claims)
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .sign(privateKey)

      const hackedToken = licenseToken
        .split('.')
        .map((value, index) => {
          if (index === 1) return `${value}hack`
          return value
        })
        .join('.')

      const result = await validateLicenseModuleAccess({
        licenseToken: hackedToken,
        canonicalUrl,
        publicKey,
        requiredModules: ['workspaces']
      })

      expect(result).to.be.false
    })
    it('succeeds for valid tokens', async () => {
      const canonicalUrl = 'https://example.com'
      const alg = 'RS256'

      const { privateKey, publicKey } = await jose.generateKeyPair(alg)

      const claims: LicenseTokenClaims = {
        allowedDomains: [canonicalUrl],
        enabledModules: {
          workspaces: true
        }
      }

      const licenseToken = await new jose.SignJWT(claims)
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .sign(privateKey)

      const result = await validateLicenseModuleAccess({
        licenseToken,
        canonicalUrl,
        publicKey,
        requiredModules: ['workspaces']
      })

      expect(result).to.be.true
    })
  })
})
