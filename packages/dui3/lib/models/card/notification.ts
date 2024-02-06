import { ConcreteComponent } from 'vue'

export type ModelCardNotification = {
  modelCardId: string
  text: string
  level: 'info' | 'danger' | 'warning' | 'success'
  cta?: {
    name: string
    action: () => void
    icon?: ConcreteComponent
  }
  dismissible: boolean
  timeout?: number
}
