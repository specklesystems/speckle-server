export type ModelCardNotification = {
  id: string
  modelCardId: string
  text: string
  level: 'info' | 'danger' | 'warning' | 'success'
  action?: ModelCardNotificationAction
  timeout?: number
  visible?: boolean
}

export type ModelCardNotificationAction = {
  url: string
  name: string
}
