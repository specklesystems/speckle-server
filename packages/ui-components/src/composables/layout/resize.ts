import type { Nullable, Optional } from '@speckle/shared'
import { useMutationObserver, useResizeObserver } from '@vueuse/core'
import { isUndefined } from 'lodash'
import { ref } from 'vue'
import type { Ref, ComputedRef } from 'vue'

/**
 * Use this to calculate the number of hidden elements (e.g. user avatars) in a wrapping flex row that
 * is styled to only show the first row. For example, there are 12 users total, there's only space for 5,
 * and this composable will calculate the number of hidden ones to use for the "+X" label (+7 in the example)
 *
 * Note: The "hidden" items must wrap into another line, because we use their offset from the top of the parent
 * to check if they're hidden (compared to items in the 1st row)
 */
export function useWrappingContainerHiddenCount(params: {
  /**
   * Element to watch for any changes
   */
  elementToWatchForChanges: Ref<Nullable<HTMLElement>>
  /**
   * The element that actually contains the potentially visible/hidden items as direct children
   */
  itemContainer: Ref<Nullable<HTMLElement>>

  /**
   * Allows you to pause calculations conditionally
   */
  skipCalculation?: ComputedRef<boolean>

  /**
   * If true, will track resizing of 'elementToWatchForChanges'.
   * Default: false
   */
  trackResize?: boolean

  /**
   * If true, will track descendants being added/removed to 'elementToWatchForChanges'.
   * Default: true
   */
  trackMutations?: boolean
}) {
  const {
    skipCalculation,
    elementToWatchForChanges,
    itemContainer,
    trackResize = false,
    trackMutations = true
  } = params || {}

  /**
   * Dynamically updated to show the number of items currently not visible in the container
   */
  const hiddenItemCount = ref(0)

  const recalculate = () => {
    const target = itemContainer.value
    if (skipCalculation?.value || !target) return

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

    hiddenItemCount.value = totalCount - visibleCount
  }

  if (trackResize) {
    useResizeObserver(elementToWatchForChanges, recalculate)
  }

  if (trackMutations) {
    useMutationObserver(elementToWatchForChanges, recalculate, {
      childList: true,
      subtree: true
    })
  }

  return {
    hiddenItemCount
  }
}
