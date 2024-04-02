import type { Optional } from '@speckle/shared'
import type { Directive } from 'vue'

const keyboardClickableKeypressHandler = (e: KeyboardEvent) => {
  if (e.code !== 'Enter') return
  ;(e.target as Optional<HTMLElement>)?.click()
}

/**
 * Makes it possible to navigate to and click on the element using the keyboard
 */
export const vKeyboardClickable: Directive<HTMLElement> = {
  created(el) {
    el.setAttribute('tabindex', '0')
    el.addEventListener('keypress', keyboardClickableKeypressHandler)
  },
  unmounted(el) {
    el.removeEventListener('keypress', keyboardClickableKeypressHandler)
  }
}
