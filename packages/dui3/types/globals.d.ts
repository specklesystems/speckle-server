export {}

import { Sketchup } from './sketchup'

declare global {
  interface Window {
    sketchup: Sketchup
    loadAccounts: () => void
    init: () => void
  }
}
