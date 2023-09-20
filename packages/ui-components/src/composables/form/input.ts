import { onKeyDown } from '@vueuse/core'
import { OperatingSystem } from '@speckle/shared'
import { clientOs, ModifierKeys } from '~~/src/helpers/form/input'
import { computed, Ref, ref } from 'vue'

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

/**
 * To support group checkboxes, the checkbox v-model API is a bit confusing: The value is `true` or `undefined`
 * not `true` or `false`.
 *
 * To simplify working with single checkboxes, you can use the model returned from this composable
 * as the model and `isChecked` as a helpful wrapper that allows you to deal with boolean values only
 */
export function useFormCheckboxModel(
  options?: Partial<{
    model: Ref<true | undefined>
  }>
) {
  const model = options?.model || ref<true | undefined>()
  const isChecked = computed({
    get: () => !!model.value,
    set: (newVal) => (model.value = newVal ? true : undefined)
  })

  return { model, isChecked }
}
