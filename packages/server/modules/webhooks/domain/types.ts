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
