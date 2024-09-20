/* eslint-disable @typescript-eslint/no-explicit-any */
import type { useJsonFormsControl } from '@jsonforms/vue'
import { cloneDeep, merge } from 'lodash-es'
import type { RuleExpression } from 'vee-validate'

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
  const { onChangeValueConverter } = options || {}

  const validator: RuleExpression<any> = () => {
    if (control.value.errors) {
      return `Value ${control.value.errors}`
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

  return {
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
    validateOnValueUpdate: false
  }
}
