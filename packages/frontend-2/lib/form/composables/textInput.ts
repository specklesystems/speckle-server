import { useField } from 'vee-validate'
import type { RuleExpression } from 'vee-validate'
import type { Ref, ToRefs } from 'vue'
import type { Nullable } from '@speckle/shared'
import { nanoid } from 'nanoid'

/**
 * Common setup for text input & textarea fields
 */
export function useTextInputCore(params: {
  props: ToRefs<{
    name: string
    help?: string
    label?: string
    showLabel?: boolean
    rules?: RuleExpression<string>
    validateOnMount?: boolean
    validateOnValueUpdate?: boolean
    modelValue?: string
    autoFocus?: boolean
    showClear?: boolean
    useLabelInErrors?: boolean
    hideErrorMessage?: boolean
  }>
  emit: {
    (e: 'change', val: { event?: Event; value: string }): void
    (e: 'clear'): void
  }
  inputEl: Ref<Nullable<HTMLInputElement | HTMLTextAreaElement>>
}) {
  const { props, inputEl, emit } = params

  const { value, errorMessage: error } = useField(props.name, props.rules, {
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

  const coreClasses = computed(() => {
    const classParts = [
      'block w-full rounded focus:outline-none bg-foundation text-foreground transition-all',
      'disabled:cursor-not-allowed disabled:bg-foundation-disabled disabled:text-disabled-muted',
      'placeholder:text-foreground-2'
    ]

    if (error.value) {
      classParts.push(
        'border-2 border-danger text-danger-darker focus:border-danger focus:ring-danger'
      )
    } else {
      classParts.push('border-0 focus:ring-2 focus:ring-outline-2')
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
  const helpTipClasses = computed((): string =>
    error.value ? 'text-danger' : 'text-foreground-2'
  )

  const focus = () => {
    inputEl.value?.focus()
  }

  const clear = () => {
    value.value = ''
    emit('change', { value: '' })
    emit('clear')
  }

  onMounted(() => {
    if (unref(props.autoFocus)) {
      focus()
    }
  })

  return {
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
