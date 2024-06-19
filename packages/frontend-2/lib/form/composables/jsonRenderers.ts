/* eslint-disable @typescript-eslint/no-explicit-any */
import type { useJsonFormsArrayControl, useJsonFormsControl } from '@jsonforms/vue'
import { useVanillaArrayControl } from '@jsonforms/vue-vanilla'
import { cloneDeep, merge } from 'lodash-es'
import { type RuleExpression } from 'vee-validate'

export function useJsonRendererBaseSetup<
  I extends ReturnType<typeof useJsonFormsControl>
>(
  input: I,
  options?: {
    onChangeValueConverter?: (val: any) => any
  }
) {
  const control = input.control as I['control']
  const fieldName = computed(() => `/${control.value.path}`)
  const label = computed(() => {
    const base = control.value.label || fieldName.value

    // If array field, just say "item"
    if (/^\/?.+\.\d+$/i.exec(base)) {
      return 'Item'
    } else {
      return base
    }
  })
  const { onChangeValueConverter } = options || {}

  const validator: RuleExpression<any> = () => {
    if (control.value.errors) {
      return `${label.value} ${control.value.errors}`
    }

    return true
  }

  const appliedOptions = computed(
    () =>
      merge(
        {},
        cloneDeep(control.value.config),
        cloneDeep(control.value.uischema.options)
      ) as Record<string, any>
  )

  const isRequired = computed(() => !!control.value.required)

  return {
    label,
    control,
    handleChange: (value: any) => {
      input.handleChange(
        control.value.path,
        onChangeValueConverter ? onChangeValueConverter(value) : value
      )
    },
    validator,
    appliedOptions,
    fieldName,
    validateOnValueUpdate: false,
    isRequired
  }
}

export function useJsonRendererArrayBaseSetup<
  I extends ReturnType<typeof useJsonFormsArrayControl>
>(input: I) {
  const control = input.control as I['control']
  const fieldName = computed(() => `/${control.value.path}`)
  const { appliedOptions, childUiSchema, childLabelForIndex } =
    useVanillaArrayControl(input)
  const isRequired = computed(() => !!control.value.required)
  const error = computed(() =>
    control.value.errors?.length
      ? `${control.value.label} ${control.value.errors}`
      : null
  )

  return {
    baseControl: input,
    control,
    appliedOptions,
    fieldName,
    childUiSchema,
    childLabelForIndex,
    isRequired,
    error
  }
}
