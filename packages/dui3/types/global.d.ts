export {}

import { Sketchup } from './sketchup'

declare global {
  interface Window {
    sketchup: Sketchup
    loadAccounts: (accounts: Account[]) => void
    init: () => void
  }
}
