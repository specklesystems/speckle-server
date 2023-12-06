import type { Nullable } from '@speckle/shared'
import { isClient } from '@vueuse/core'
import type { MaybeRef } from '@vueuse/core'
import { debounce, isUndefined, throttle } from 'lodash'
import { computed, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'

export enum ThrottleOrDebounce {
  Throttle,
  Debounce
}

export enum HorizontalDirection {
  Left,
  Right
}

export function useWindowResizeHandler(
  handler: (e: UIEvent) => void,
  options?: Partial<{
    wait: number
    throttleOrDebounce: ThrottleOrDebounce
  }>
) {
  if (!isClient) return

  const { wait = 100, throttleOrDebounce = ThrottleOrDebounce.Throttle } = options || {}
  const finalHandler = wait
    ? throttleOrDebounce === ThrottleOrDebounce.Throttle
      ? throttle(handler, wait)
      : debounce(handler, wait)
    : handler

  onMounted(() => window.addEventListener('resize', finalHandler))
  onBeforeUnmount(() => window.removeEventListener('resize', finalHandler))
}

export function useOnBeforeWindowUnload(handler: (e: BeforeUnloadEvent) => void) {
  onMounted(() => {
    window.addEventListener('beforeunload', handler)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handler)
  })
}

export function useResponsiveHorizontalDirectionCalculation(params: {
  el: MaybeRef<Nullable<HTMLElement>>
  defaultDirection?: HorizontalDirection
  /**
   * Stop recalculation below this screen size. Defaults to el.width * 2
   */
  stopUpdatesBelowWidth?: MaybeRef<number>
}) {
  const { el, defaultDirection } = params

  const direction = ref<HorizontalDirection>(
    !isUndefined(defaultDirection) ? defaultDirection : HorizontalDirection.Right
  )
  const stopUpdatesBelowWidth = computed(() => {
    const stopUpdatesBelowWidth = unref(params.stopUpdatesBelowWidth)
    if (!isUndefined(stopUpdatesBelowWidth)) return stopUpdatesBelowWidth

    const element = unref(el)
    return element?.offsetWidth ? element.offsetWidth * 2 : undefined
  })

  const recalculateDirection = () => {
    if (!isClient) return

    const element = unref(el)
    if (!element) return

    const rect = element.getBoundingClientRect()
    const showOnLeftSide = rect.x + rect.width > window.innerWidth
    const showOnRightSide = rect.x < 0

    // Screen too small - do nothing
    if (
      (showOnLeftSide && showOnRightSide) ||
      (!isUndefined(stopUpdatesBelowWidth.value) &&
        window.innerWidth < stopUpdatesBelowWidth.value)
    )
      return

    if (showOnLeftSide) {
      direction.value = HorizontalDirection.Left
    } else if (showOnRightSide) {
      direction.value = HorizontalDirection.Right
    }
  }

  useWindowResizeHandler(() => recalculateDirection())

  watch(
    () => unref(el),
    (element) => {
      if (element) {
        recalculateDirection()
      }
    }
  )

  return {
    direction: computed(() => direction.value),
    recalculateDirection
  }
}
