import type { IDiscriminatedObject } from '~/lib/bindings/definitions/common'

export interface CardSetting extends IDiscriminatedObject {
  id: string
  type: string
  title: string
  value: CardSettingValue
  enum?: string[]
}

export type CardSettingValue = string | number | boolean
