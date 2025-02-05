import { useMagicKeys, whenever } from '@vueuse/core'
import { OperatingSystem } from '@speckle/shared'
import { clientOs, ModifierKeys } from '~~/src/helpers/form/input'
import { computed, ref } from 'vue'
import type { Ref } from 'vue'

export type LabelPosition = 'top' | 'left'

/**
 * onKeyDown wrapper that also checks for modifier keys being pressed
 */
export function onKeyboardShortcut(
  modifiers: ModifierKeys[],
  key: string,
  callback: () => void
) {
  const keys = useMagicKeys()

  const modifierKeys = modifiers.map((modifier) => {
    switch (modifier) {
      case ModifierKeys.CtrlOrCmd:
        return clientOs === OperatingSystem.Mac ? 'Meta' : 'Control'
      case ModifierKeys.AltOrOpt:
        return 'Alt'
      case ModifierKeys.Shift:
        return 'Shift'
      default:
        return ''
    }
  })

  const keyCombination = `${modifierKeys.join('+')}+${key}`

  whenever(keys[keyCombination], callback)
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
