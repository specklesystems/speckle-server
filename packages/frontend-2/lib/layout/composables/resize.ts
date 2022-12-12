import { Nullable, Optional } from '@speckle/shared'
import { useResizeObserver } from '@vueuse/core'
import { isUndefined } from 'lodash-es'
import { ComputedRef } from 'vue'

export function useWrappingContainerHiddenCount(
  params?: Partial<{
    /**
     * Allows you to pause calculations conditionally
     */
    skipCalculation: ComputedRef<boolean>
  }>
) {
  const { skipCalculation } = params || {}

  /**
   * Add this ref to the parent element of elements that dynamically become visible or invisible
   * depending on the amount of space inside the wrapper, for example, a limited width & height flexbox
   * container that wraps into multiple lines and only shows the first line.
   *
   * This is used to calculate the amount of hidden items
   */
  const containerWrapper = ref(null as Nullable<HTMLElement>)

  /**
   * Dynamically updated to show the number of items currently not visible in the container
   */
  const hiddenSelectedItemCount = ref(0)

  /**
   * Update hidden item count
   */
  useResizeObserver(containerWrapper, (entries) => {
    if (skipCalculation?.value) return

    const entry = entries[0]
    const target = entry.target
    const avatarElements = target.children

    /**
     * Comparing offset from parent to between all avatars to see when they break off into another line
     * and become invisible
     */
    let visibleCount = 0
    let totalCount = 0
    let firstElOffsetTop = undefined as Optional<number>
    for (const avatarEl of avatarElements) {
      const offsetTop = (avatarEl as HTMLElement).offsetTop
      if (isUndefined(firstElOffsetTop)) {
        firstElOffsetTop = offsetTop
        visibleCount += 1
      } else {
        if (offsetTop === firstElOffsetTop) {
          visibleCount += 1
        }
      }

      totalCount += 1
    }

    hiddenSelectedItemCount.value = totalCount - visibleCount
  })

  return {
    containerWrapper,
    hiddenSelectedItemCount
  }
}
