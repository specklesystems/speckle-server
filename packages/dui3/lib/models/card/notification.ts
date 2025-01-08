import type { ConversionResult } from '~/lib/conversions/conversionResult'

export type ModelCardNotification = {
  modelCardId: string
  text: string
  level: 'info' | 'danger' | 'warning' | 'success'
  cta?: {
    name: string
    action: () => void
  }
  /**
   * If set, will display a view report button next to cta
   */
  report?: ConversionResult[]
  // TODO figure out re report button
  dismissible: boolean
  timeout?: number
}
