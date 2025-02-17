import * as jose from 'jose'
import {
  isDevEnv,
  getServerOrigin,
  getLicenseToken,
  isTestEnv
} from '@/modules/shared/helpers/envHelper'
import { LicenseTokenClaims, EnabledModules } from '@/modules/gatekeeper/domain/types'

type LicensedModuleNames = (keyof EnabledModules)[]

export const validateLicenseModuleAccess = async ({
  licenseToken,
  canonicalUrl,
  publicKey,
  requiredModules
}: {
  licenseToken: string
  canonicalUrl: string
  publicKey: jose.KeyLike
  requiredModules: LicensedModuleNames
}): Promise<boolean> => {
  try {
    const { payload } = await jose.jwtVerify(licenseToken, publicKey)

    const claims = LicenseTokenClaims.safeParse(payload)
    if (!claims.success) return false

    // make sure we match the allowedDomains
    if (!claims.data.allowedDomains.includes(canonicalUrl)) return false

    const enabledModules = claims.data.enabledModules
    for (const moduleName of requiredModules) {
      if (enabledModules[moduleName as keyof EnabledModules] !== true) return false
    }
    return true
  } catch (err) {
    if (err instanceof jose.errors.JOSEError) {
      // I'm deliberately hiding all internal details here, if any checks fail, its an invalid token
      return false
    }
  }
  return false
}

let publicKey: jose.KeyLike | undefined

const getPublicKey = async (): Promise<jose.KeyLike> => {
  if (!publicKey) {
    const alg = 'RS256'
    const publicKeyString = `-----BEGIN PUBLIC KEY-----
  MIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAu3KR87R/7UTLAKqHyzIs
  00jfLd4jFw6WCKzRQv87QDcu/WAiHzBJtgys7RWmMxCN2wkbpDG80GjSsB+/yRDc
  cjw5eF+nPYsvCzyQVHaVJnhsa2P2qSXIWucSGnHhpgPkL7Rm5xCCoNzYWmn83S83
  haw+vYMVURNdcTfj+6vXimRodnDJe644Jna5Xp3hs1PVzuMvDwAUaNQdki/2/0is
  al3J8WsbtAJcah59flDODPu5BpMwbd0ZgixWBfCOuJvD5T5v7d7di8gY21t7OnJ8
  1+6zAR3EKKHqWN2Wf8BvwiC8AXjUkSizqLhEnyhDC3IJ9I0zpu7gtqKYdBRj87wz
  icHb8zyKZq6nxEEk3jxUfNYYy41//w3l9j6trvhFn88fd1ZuIlVq3xS1RC7176UA
  LoKwZqDMZAJj5sIASmr13eKyuLvFMmB8jBedC4O5iW6FPq/+wnC+Td2TyssdSKi1
  VUj/fs12T81Xk2HYqxx+qLhSlFA3aocciQNZHvd3muyfAgMBAAE=
  -----END PUBLIC KEY-----
  `
    publicKey = await jose.importSPKI(publicKeyString, alg)
  }
  return publicKey
}

export const validateModuleLicense = async ({
  requiredModules
}: {
  requiredModules: LicensedModuleNames
}): Promise<boolean> => {
  if (isDevEnv() || isTestEnv()) return true
  const licenseToken = getLicenseToken()
  if (!licenseToken) return false
  const publicKey = await getPublicKey()
  const canonicalUrl = getServerOrigin()
  return validateLicenseModuleAccess({
    licenseToken,
    canonicalUrl,
    publicKey,
    requiredModules
  })
}
