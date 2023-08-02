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
