export type ModelCardNotification = {
  modelCardId: string
  text: string
  level: 'info' | 'danger' | 'warning' | 'success'
  cta?: {
    name: string
    action: () => void
  }
  // TODO figure out re report button
  dismissible: boolean
  timeout?: number
}
