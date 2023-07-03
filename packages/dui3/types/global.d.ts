export {}

import { Sketchup } from './sketchup'
import { Chrome } from './chrome/chrome'

declare global {
  interface Window {
    sketchup: Sketchup
    chrome: Chrome
    loadAccounts: (accounts: Account[]) => void
  }
}
