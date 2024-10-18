import { type LayoutDialogButton } from '@speckle/ui-components'

export type TutorialItem = {
  id: string
  title: string
  lastPublished: string
  featureImageUrl?: string
  url: string
}

export type QuickStartItem = {
  title: string
  description: string
  buttons: LayoutDialogButton[]
}
