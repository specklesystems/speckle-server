import { type LayoutDialogButton } from '@speckle/ui-components'

export type TutorialItem = {
  title: string
  image: string
  url: string
}

export type QuickStartItem = {
  title: string
  description: string
  buttons: LayoutDialogButton[]
}
