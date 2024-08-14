export type Webhook = {
  id: string
  streamId: string
  url: string
  description: string
  secret: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
  triggers: string[]
}
