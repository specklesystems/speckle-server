/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { RuleExpression, useField } from 'vee-validate'
import { Ref, ToRefs, computed, onMounted, ref, unref } from 'vue'
import { Nullable } from '@speckle/shared'
import { nanoid } from 'nanoid'
import { isArray } from 'lodash'

export type InputColor = 'page' | 'foundation'

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
}) {
  const { props, inputEl, emit } = params

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
    const classParts = ['mt-2 text-sm']
    classParts.push(error.value ? 'text-danger' : 'text-foreground-2')
    return classParts.join(' ')
  })

  const focus = () => {
    inputEl.value?.focus()
  }

  const clear = () => {
    value.value = (isArray(value.value) ? [] : '') as V
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
    labelClasses
  }
}

// /**
//  * Used by TextInput & other single line text input components like the tags
//  * combobox
//  */
// export const useSingleLineTextInput = <V extends string | string[] = string>(
//   params: Parameters<typeof useTextInputCore<V>>[0]
// ) => {
//   const core = useTextInputCore(params)

// const sizeClasses = computed((): string => {
//   switch (props.size) {
//     case 'sm':
//       return 'h-6'
//     case 'lg':
//       return 'h-10'
//     case 'xl':
//       return 'h-14'
//     case 'base':
//     default:
//       return 'h-8'
//   }
// })

//   return {
//     ...core
//   }
// }
