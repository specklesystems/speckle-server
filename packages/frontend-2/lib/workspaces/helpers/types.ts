export type SsoFormValues = {
  providerName: string
  clientId: string
  clientSecret: string
  issuerUrl: string
}

export type WorkspaceSsoProviderPublic = {
  name: string
  logo?: string | null
  defaultLogoIndex: number
  ssoProviderName?: string | null
}

export type WorkspaceSsoError = {
  message: string
  status?: number
}

export enum WorkspaceSsoErrorCodes {
  SESSION_MISSING_OR_EXPIRED = 'SSO_SESSION_MISSING_OR_EXPIRED_ERROR',
  VERIFICATION_CODE_MISSING = 'SSO_VERIFICATION_CODE_MISSING_ERROR',
  PROVIDER_TYPE_NOT_SUPPORTED = 'SSO_PROVIDER_TYPE_NOT_SUPPORTED',
  PROVIDER_EXISTS = 'SSO_PROVIDER_EXISTS_ERROR',
  PROVIDER_MISSING = 'SSO_PROVIDER_MISSING_ERROR'
}
