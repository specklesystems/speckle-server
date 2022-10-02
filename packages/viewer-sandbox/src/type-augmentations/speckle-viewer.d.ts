import { SelectionEvent } from '@speckle/viewer'

declare module '@speckle/viewer' {
  interface SelectionEvent {
    userData: {
      id: string
    }
  }
}
