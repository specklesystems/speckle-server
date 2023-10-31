import { useWindowResizeHandler } from '@speckle/ui-components'
export {
  ThrottleOrDebounce,
  HorizontalDirection,
  useWindowResizeHandler,
  useOnBeforeWindowUnload,
  useResponsiveHorizontalDirectionCalculation
} from '@speckle/ui-components'

export function useDisableGlobalTextSelection() {
  const disableTextSelection = ref(false)

  if (process.client) {
    watch(disableTextSelection, (newVal, oldVal) => {
      if (!!newVal === !!oldVal) return

      if (newVal) {
        document.body.classList.add('select-none')
      } else {
        document.body.classList.remove('select-none')
      }
    })
  }

  return { disableTextSelection }
}

export enum Breakpoint {
  xs = 425,
  sm = 640,
  md = 768,
  lg = 1024,
  xl = 1280
}

export function useBreakpoints() {
  const width = ref(window.innerWidth)

  const updateDimensions = () => {
    width.value = window.innerWidth
  }

  useWindowResizeHandler(updateDimensions)

  const isMediaQueryMax = (breakpoint: Breakpoint) => {
    return computed(() => width.value <= breakpoint)
  }

  const isMediaQueryMin = (breakpoint: Breakpoint) => {
    return computed(() => width.value >= breakpoint)
  }

  return {
    width: computed(() => width.value),
    isMediaQueryMax,
    isMediaQueryMin
  }
}
