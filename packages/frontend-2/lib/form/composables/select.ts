/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { isArray } from 'lodash-es'
import { Ref, ToRefs } from 'vue'
import { Nullable } from '@speckle/shared'
import { useWrappingContainerHiddenCount } from '~~/lib/layout/composables/resize'

type GenericSelectValueType<T> = T | T[] | undefined

export function useFormSelectChildInternals<T>(params: {
  props: ToRefs<{
    modelValue?: GenericSelectValueType<T>
    multiple?: boolean
  }>
  emit: {
    (e: 'update:modelValue', val: GenericSelectValueType<T>): void
  }
  /**
   * @see {useWrappingContainerHiddenCount()}
   */
  dynamicVisibility: {
    elementToWatchForChanges: Ref<Nullable<HTMLElement>>
    itemContainer: Ref<Nullable<HTMLElement>>
  }
}) {
  const {
    props,
    emit,
    dynamicVisibility: { elementToWatchForChanges, itemContainer }
  } = params

  const { hiddenItemCount } = useWrappingContainerHiddenCount({
    skipCalculation: computed(() => !props.multiple?.value),
    elementToWatchForChanges,
    itemContainer
  })

  /**
   * Use this to get or set the v-model value of the select input in a proper way
   */
  const selectedValue = computed({
    get: (): GenericSelectValueType<T> => {
      const currentValue = props.modelValue?.value
      if (props.multiple?.value) {
        return isArray(currentValue) ? currentValue : []
      } else {
        return isArray(currentValue) ? undefined : currentValue
      }
    },
    set: (newVal: GenericSelectValueType<T>) => {
      if (props.multiple?.value && !isArray(newVal)) {
        console.warn('Attempting to set non-array value in selector w/ multiple=true')
        return
      } else if (!props.multiple?.value && isArray(newVal)) {
        console.warn('Attempting to set array value in selector w/ multiple=false')
        return
      }

      emit('update:modelValue', props.multiple?.value ? newVal || [] : newVal)
    }
  })

  const isArrayValue = (v: GenericSelectValueType<T>): v is T[] => isArray(v)
  const isMultiItemArrayValue = (v: GenericSelectValueType<T>): v is T[] =>
    isArray(v) && v.length > 1
  const firstItem = (v: NonNullable<GenericSelectValueType<T>>): T =>
    isArrayValue(v) ? v[0] : v

  return {
    selectedValue,
    hiddenSelectedItemCount: hiddenItemCount,
    isArrayValue,
    isMultiItemArrayValue,
    firstItem
  }
}
