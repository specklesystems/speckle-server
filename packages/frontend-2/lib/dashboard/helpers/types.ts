import { type LayoutDialogButton } from '@speckle/ui-components'

export interface TutorialItem {
  title: string
  publishedAt: string
  image?: string
  id: string
  url: string
}

export type QuickStartItem = {
  title: string
  description: string
  buttons: LayoutDialogButton[]
}
