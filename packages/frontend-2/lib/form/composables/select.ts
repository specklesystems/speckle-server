/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { isArray, isUndefined } from 'lodash-es'
import { ToRefs } from 'vue'
import { Nullable, Optional } from '@speckle/shared'
import { useResizeObserver } from '@vueuse/core'

type GenericSelectValueType<T> = T | T[] | undefined

export function useFormSelectChildInternals<T>(params: {
  props: ToRefs<{
    modelValue?: GenericSelectValueType<T>
    multiple?: boolean
  }>
  emit: {
    (e: 'update:modelValue', val: GenericSelectValueType<T>): void
  }
}) {
  const { props, emit } = params

  /**
   * Add this ref to the parent element of elements that dynamically become visible or invisible
   * depending on the amount of space inside the select input. This will ensure the "+X" label
   * is properly updated in real-time to show how many items are hidden.
   */
  const dynamicallyVisibleSelectedItemWrapper = ref(null as Nullable<HTMLElement>)

  /**
   * Dynamically updates to show the number of items currently not visible in the select input. Use
   * this to render the "+X" label.
   */
  const hiddenSelectedItemCount = ref(0)

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

  /**
   * Update hidden item count
   */
  useResizeObserver(dynamicallyVisibleSelectedItemWrapper, (entries) => {
    if (!props.multiple) return

    const entry = entries[0]
    const target = entry.target
    const avatarElements = target.children

    /**
     * Comparing offset from parent to between all avatars to see when they break off into another line
     * and become invisible
     */
    const totalCount = isArray(selectedValue.value) ? selectedValue.value.length : 1
    let visibleCount = 0
    let firstElOffsetTop = undefined as Optional<number>
    for (const avatarEl of avatarElements) {
      const offsetTop = (avatarEl as HTMLElement).offsetTop
      if (isUndefined(firstElOffsetTop)) {
        firstElOffsetTop = offsetTop
        visibleCount += 1
      } else {
        if (offsetTop === firstElOffsetTop) {
          visibleCount += 1
        } else {
          break
        }
      }
    }

    hiddenSelectedItemCount.value = totalCount - visibleCount
  })

  const isArrayValue = (v: GenericSelectValueType<T>): v is T[] => isArray(v)
  const isMultiItemArrayValue = (v: GenericSelectValueType<T>): v is T[] =>
    isArray(v) && v.length > 1
  const firstItem = (v: NonNullable<GenericSelectValueType<T>>): T =>
    isArrayValue(v) ? v[0] : v

  return {
    selectedValue,
    dynamicallyVisibleSelectedItemWrapper,
    hiddenSelectedItemCount,
    isArrayValue,
    isMultiItemArrayValue,
    firstItem
  }
}
