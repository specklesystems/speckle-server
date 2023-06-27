import { CallbackMessage } from '~/types/callbackMessage'
import { CallbackFunction } from '~/types/callbackFunction'

/**
 * Calls host application.
 * TODO: Need to figure it out for each host application.
 * @param msg collects information to pass host application.
 * @returns
 */
export const execHost: CallbackFunction = (msg: CallbackMessage) => {
  if (window.sketchup) {
    return window.sketchup.exec(msg)
  }
}
