const KEYBOARD_CLICK_CHAR = 'Enter'

/**
 * Visible, non-interactive elements with click handlers must have at least one keyboard listener for accessibility.
 * You can wrap your click handler with this in @keypress, to run it when enter is pressed on the selected component
 * @deprecated Use vKeyboardClickable directive instead
 * See more: https://github.com/vue-a11y/eslint-plugin-vuejs-accessibility/blob/main/docs/click-events-have-key-events.md
 */
export function keyboardClick(cb: (e: KeyboardEvent) => void) {
  return (e: KeyboardEvent) => {
    if (e.code !== KEYBOARD_CLICK_CHAR) return
    cb(e)
  }
}
