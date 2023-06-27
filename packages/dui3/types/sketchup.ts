import { CallbackMessage } from './callbackMessage'

export type Sketchup = {
  exec: (msg: CallbackMessage) => void
}
