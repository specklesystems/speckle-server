export type Integration = {
  name: string
  description: string
  cookieKey: string
  logo: string
  connected: boolean
  enabled: boolean
  status: 'connected' | 'expired' | 'notConnected'
  callbackEndpoint?: string
}
