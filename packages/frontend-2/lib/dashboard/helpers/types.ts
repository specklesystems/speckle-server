import type { Nullable } from '@speckle/shared'
import { type LayoutDialogButton } from '@speckle/ui-components'

export type TutorialItem = {
  id: string
  readingTime?: number
  publishedAt?: Nullable<string>
  url?: string
  title?: string
  featureImage?: Nullable<string>
}

export type QuickStartItem = {
  title: string
  description: string
  buttons: LayoutDialogButton[]
}
