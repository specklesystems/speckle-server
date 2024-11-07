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
