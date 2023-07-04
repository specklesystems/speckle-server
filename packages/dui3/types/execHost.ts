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
    console.log('sketchup called')
    return window.sketchup.exec(msg)
  } else if (window.chrome.webview) {
    console.log('webview called')
    return window.chrome.webview.hostObjects.webviewBindings.exec(
      msg.viewId,
      msg.name,
      msg.data
    )
  }
  console.log('message not called to any host!')
}
