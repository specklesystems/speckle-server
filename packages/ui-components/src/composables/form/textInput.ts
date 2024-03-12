/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useField } from 'vee-validate'
import type { RuleExpression } from 'vee-validate'
import { computed, onMounted, ref, unref, watch } from 'vue'
import type { Ref, ToRefs } from 'vue'
import type { MaybeNullOrUndefined, Nullable } from '@speckle/shared'
import { nanoid } from 'nanoid'
import { debounce, isArray } from 'lodash'

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
    hideErrorMessage?: boolean
    color?: InputColor
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

  const { value, errorMessage: error } = useField<V>(props.name, props.rules, {
    validateOnMount: unref(props.validateOnMount),
    validateOnValueUpdate: unref(props.validateOnValueUpdate),
    initialValue: unref(props.modelValue) || undefined
  })

  const labelClasses = computed(() => {
    const classParts = ['block label text-foreground-2 mb-2']
    if (!unref(props.showLabel)) {
      classParts.push('sr-only')
    }

    return classParts.join(' ')
  })

  const coreInputClasses = computed(() => {
    const classParts: string[] = [
      'focus:outline-none disabled:cursor-not-allowed disabled:bg-foundation-disabled',
      'disabled:text-disabled-muted placeholder:text-foreground-2',
      'rounded'
    ]

    return classParts.join(' ')
  })

  const coreClasses = computed(() => {
    const classParts = [
      'block w-full text-foreground transition-all',
      coreInputClasses.value
    ]

    if (error.value) {
      classParts.push(
        'focus:border-danger focus:ring-danger border-2 border-danger text-danger-darker'
      )
    } else {
      classParts.push('border-0 focus:ring-2 focus:ring-outline-2')
    }

    const color = unref(props.color)
    if (color === 'foundation') {
      classParts.push('bg-foundation shadow-sm hover:shadow')
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
    const base = error.value
    if (!base || !unref(props.useLabelInErrors)) return base
    return base.replace('Value', title.value)
  })

  const hideHelpTip = computed(
    () => errorMessage.value && unref(props.hideErrorMessage)
  )
  const helpTip = computed(() => errorMessage.value || unref(props.help))
  const hasHelpTip = computed(() => !!helpTip.value)
  const helpTipId = computed(() =>
    hasHelpTip.value ? `${unref(props.name)}-${internalHelpTipId.value}` : undefined
  )
  const helpTipClasses = computed((): string => {
    const classParts = ['mt-2 text-xs sm:text-sm']
    classParts.push(error.value ? 'text-danger' : 'text-foreground-2')
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
    shouldShowClear
  }
}

/**
 * Attach returned on and bind using v-on and v-bind, and then you can use the returned `value`
 * ref to get the input's value while ensuring normal input events are debounced and only change/clear
 * events cause the value to propagate immediately
 *
 * Very useful for search inputs!
 */
export function useDebouncedTextInput(params: {
  /**
   * For how long should basic input events be debounced.
   * Default: 1000 (ms)
   */
  debouncedBy?: number

  /**
   * Optionally pass in the model ref that should be used as the source of truth
   */
  model?: Ref<MaybeNullOrUndefined<string>>
}) {
  const { debouncedBy = 1000 } = params

  const value = params.model || ref('')
  const model = ref(value.value)

  const debouncedValueUpdate = debounce((val: string) => {
    value.value = val
  }, debouncedBy)

  const on = {
    'update:modelValue': (val: string) => {
      model.value = val
      debouncedValueUpdate(val)
    },
    clear: () => {
      debouncedValueUpdate.cancel()
      model.value = ''
      value.value = ''
    },
    change: (val: { event?: Event; value: string }) => {
      debouncedValueUpdate.cancel()
      value.value = val.value
      model.value = val.value
    }
  }
  const bind = {
    modelValue: computed(() => model.value || '')
  }

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
