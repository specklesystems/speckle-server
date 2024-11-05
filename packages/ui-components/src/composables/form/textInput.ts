/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useField } from 'vee-validate'
import type { RuleExpression } from 'vee-validate'
import { computed, onMounted, ref, unref, watch } from 'vue'
import type { Ref, ToRefs } from 'vue'
import type { MaybeNullOrUndefined, Nullable } from '@speckle/shared'
import { nanoid } from 'nanoid'
import { debounce, isArray, isBoolean, isString, isUndefined, noop } from 'lodash'
import type { LabelPosition } from './input'

export type InputColor = 'page' | 'foundation' | 'transparent'

/**
 * Common setup for text input & textarea fields
 */
export function useTextInputCore<V extends string | string[] = string>(params: {
  props: ToRefs<{
    name: string
    help?: string
    label?: string
    showLabel?: boolean
    rules?: RuleExpression<V>
    validateOnMount?: boolean
    validateOnValueUpdate?: boolean
    modelValue?: V
    autoFocus?: boolean
    showClear?: boolean
    useLabelInErrors?: boolean
    customErrorMessage?: string
    hideErrorMessage?: boolean
    color?: InputColor
    labelPosition?: LabelPosition
  }>
  emit: {
    (e: 'change', val: { event?: Event; value: V }): void
    (e: 'clear'): void
  }
  inputEl: Ref<Nullable<HTMLInputElement | HTMLTextAreaElement>>
  options?: Partial<{
    customClear: () => void
  }>
}) {
  const { props, inputEl, emit, options } = params

  const { value, errorMessage: veeErrorMessage } = useField<V>(
    props.name,
    props.rules,
    {
      validateOnMount: unref(props.validateOnMount),
      validateOnValueUpdate: unref(props.validateOnValueUpdate),
      initialValue: unref(props.modelValue) || undefined
    }
  )

  const labelClasses = computed(() => {
    const classParts = [
      'flex text-body-xs font-medium gap-1 items-center',
      unref(props.color) === 'foundation' ? 'text-foreground' : 'text-foreground-2',
      unref(props.labelPosition) !== 'left' ? 'pb-1' : null
    ]
    if (!unref(props.showLabel)) {
      classParts.push('sr-only')
    }

    return classParts.join(' ')
  })

  const coreInputClasses = computed(() => {
    const classParts: string[] = [
      'focus:outline-none disabled:cursor-not-allowed disabled:bg-foundation-disabled',
      'disabled:text-disabled-muted placeholder:text-foreground-2',
      'rounded-md'
    ]

    return classParts.join(' ')
  })

  const coreClasses = computed(() => {
    const classParts = [
      'block w-full text-foreground transition-all text-body-sm',
      coreInputClasses.value
    ]

    if (hasError.value) {
      classParts.push('!border-danger')
    } else {
      classParts.push('border-0 focus:ring-2 focus:ring-outline-2')
    }

    const color = unref(props.color)
    if (color === 'foundation') {
      classParts.push(
        'bg-foundation !border border-outline-2 hover:border-outline-5 focus-visible:border-outline-4 !ring-0 focus-visible:!outline-0 !text-[13px]'
      )
    } else if (color === 'transparent') {
      classParts.push('bg-transparent')
    } else {
      classParts.push('bg-foundation-page')
    }

    return classParts.join(' ')
  })

  const internalHelpTipId = ref(nanoid())

  const title = computed(() => unref(props.label) || unref(props.name))

  const errorMessage = computed(() => {
    if (unref(props.customErrorMessage)) {
      return unref(props.customErrorMessage)
    }

    const base = veeErrorMessage.value
    if (!base || !unref(props.useLabelInErrors)) return base
    return base.replace('Value', title.value)
  })

  const hasError = computed(() => !!errorMessage.value)

  const hideHelpTip = computed(
    () => errorMessage.value && unref(props.hideErrorMessage)
  )
  const helpTip = computed(() => errorMessage.value || unref(props.help))
  const hasHelpTip = computed(() => !!helpTip.value)
  const helpTipId = computed(() =>
    hasHelpTip.value ? `${unref(props.name)}-${internalHelpTipId.value}` : undefined
  )
  const helpTipClasses = computed((): string => {
    const classParts = ['text-body-2xs break-words']
    classParts.push(hasError.value ? 'text-danger' : 'text-foreground-2')
    return classParts.join(' ')
  })
  const shouldShowClear = computed(() => {
    if (!unref(props.showClear)) return false
    return (value.value?.length || 0) > 0
  })

  const focus = () => {
    inputEl.value?.focus()
  }

  const clear = () => {
    value.value = (isArray(value.value) ? [] : '') as V
    options?.customClear?.()

    emit('change', { value: value.value })
    emit('clear')
  }

  onMounted(() => {
    if (unref(props.autoFocus)) {
      focus()
    }
  })

  return {
    coreInputClasses,
    coreClasses,
    title,
    value,
    helpTipId,
    helpTipClasses,
    helpTip,
    hideHelpTip,
    errorMessage,
    clear,
    focus,
    labelClasses,
    shouldShowClear,
    hasError
  }
}

type FormInputChangeEvent = { event?: Event; value: string }

/**
 * Attach returned on and bind using v-on and v-bind, and then you can use the returned `value`
 * ref to get the input's value while ensuring normal input events are debounced and only change/clear
 * events cause the value to propagate immediately
 *
 * Very useful for search inputs and other kind of auto-submitting inputs!
 */
export function useDebouncedTextInput(params?: {
  /**
   * For how long should basic input events be debounced.
   * Default: 1000 (ms)
   */
  debouncedBy?: number

  /**
   * Optionally pass in the model ref that should be used as the source of truth
   */
  model?: Ref<MaybeNullOrUndefined<string>>

  /**
   * Set to true if you're tracking changes on a basic HTML input element. This will change the events
   * being used (e.g. input instead of update:modelValue)
   *
   * Default: false
   */
  isBasicHtmlInput?: boolean

  /**
   * Set to false if you don't want the change event to be emitted on Enter key press.
   * Setting only works for basic html inputs currently!
   *
   * Default: Default behavior (true for input, false for textarea)
   */
  submitOnEnter?: boolean

  /**
   * Set to true if you want to see debug output for how events fire and are handled
   */
  debug?: boolean | ((...logArgs: unknown[]) => void)
}) {
  const { debouncedBy = 1000, isBasicHtmlInput = false, submitOnEnter } = params || {}
  const log = params?.debug
    ? isBoolean(params.debug)
      ? console.debug
      : params.debug
    : noop

  const value = params?.model || ref('')
  const model = ref(value.value)

  const getValue = (val: string | InputEvent | Event | FormInputChangeEvent) => {
    if (isString(val)) return val
    if ('value' in val) return val.value

    const target = val.target as Nullable<HTMLInputElement | HTMLTextAreaElement>
    return target?.value || ''
  }

  const debouncedValueUpdate = debounce((val: string) => {
    value.value = val
    log('Value updated: ' + val)
  }, debouncedBy)

  const inputEventName = isBasicHtmlInput ? 'input' : 'update:modelValue'
  const on = {
    [inputEventName]: (val: string | InputEvent) => {
      const newVal = getValue(val)
      model.value = newVal
      debouncedValueUpdate(newVal)
      log(`Input event [${inputEventName}] triggered: ${newVal}`)
    },
    clear: () => {
      debouncedValueUpdate.cancel()
      model.value = ''
      value.value = ''
      log('Clear event')
    },
    change: (val: FormInputChangeEvent | Event) => {
      const newVal = getValue(val)
      debouncedValueUpdate.cancel()
      value.value = newVal
      model.value = newVal
      log('Change event: ' + newVal)
    },
    keydown: (e: KeyboardEvent) => {
      if (!isBasicHtmlInput) return
      if (isUndefined(submitOnEnter)) return

      const isEnter = e.key === 'Enter'
      if (!isEnter) return

      const isTextarea = e.target instanceof HTMLTextAreaElement

      if (isTextarea) {
        if (submitOnEnter) {
          log('Triggering submit on enter')
          e.preventDefault()
          e.stopPropagation()
          on.change(e)
        }
      } else {
        if (!submitOnEnter) {
          log('Preventing submit on enter')
          e.preventDefault()
          e.stopPropagation()
        }
      }
    }
  }
  const bind = computed(() => ({
    modelValue: model.value || ''
  }))

  watch(value, (newVal, oldVal) => {
    if (oldVal === newVal && !oldVal && !newVal) return
    if (model.value === value.value) return
    model.value = value.value
  })

  return {
    on,
    bind,
    value
  }
}
