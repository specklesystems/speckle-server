import { type LayoutDialogButton } from '@speckle/ui-components'

export type WebflowItem = {
  id: string
  title: string
  createdOn: string
  lastPublished: string
  featureImageUrl?: string
  url: string
  readTime?: number
}

export type QuickStartItem = {
  title: string
  description: string
  buttons: LayoutDialogButton[]
}
