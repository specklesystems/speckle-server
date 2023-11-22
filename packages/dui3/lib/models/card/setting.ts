import { IDiscriminatedObject } from '~/lib/bindings/definitions/common'

export interface CardSetting extends IDiscriminatedObject {
  id: string
  type: string
  title: string
  default: string | number | boolean
  enum?: string[]
}
