export type ModelCardNotification = {
  modelCardId: string
  text: string
  level: 'info' | 'danger' | 'warning' | 'success'
  cta?: {
    name: string
    action: () => void
  }
  dismissible: boolean
  timeout?: number
}
