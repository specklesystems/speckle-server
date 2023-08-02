import { onKeyDown } from '@vueuse/core'
import { OperatingSystem } from '@speckle/shared'
import { clientOs, ModifierKeys } from '~~/src/helpers/form/input'

/**
 * onKeyDown wrapper that also checks for modifier keys being pressed
 */
export function onKeyboardShortcut(
  modifiers: ModifierKeys[],
  ...args: Parameters<typeof onKeyDown>
) {
  onKeyDown(
    args[0],
    (e) => {
      const isAltOrOpt = e.getModifierState('Alt')
      const isCtrlOrCmd =
        clientOs === OperatingSystem.Mac
          ? e.getModifierState('Meta')
          : e.getModifierState('Control')
      const isShift = e.getModifierState('Shift')

      for (const modifier of modifiers) {
        switch (modifier) {
          case ModifierKeys.CtrlOrCmd:
            if (!isCtrlOrCmd) return
            break
          case ModifierKeys.AltOrOpt:
            if (!isAltOrOpt) return
            break
          case ModifierKeys.Shift:
            if (!isShift) return
            break
        }
      }

      args[1](e)
    },
    args[2]
  )
}
