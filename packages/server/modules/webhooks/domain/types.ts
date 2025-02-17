export type Webhook = {
  id: string
  streamId: string
  url?: string
  description?: string
  secret?: string
  enabled: boolean
  triggers: string[]
  createdAt: Date
  updatedAt: Date
}

export type WebhookEvent = {
  id: string
  webhookId: string
  status: number
  statusInfo: string
  retryCount: number
  lastUpdate: Date
  payload: string
}
