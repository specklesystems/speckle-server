import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'

export function useProjectPageItemViewType(contentType: string) {
  const viewTypeCookie = useSynchronizedCookie(`projectPage-${contentType}-viewType`)
  const gridOrList = computed({
    get: () =>
      viewTypeCookie.value === GridListToggleValue.List
        ? GridListToggleValue.List
        : GridListToggleValue.Grid,
    set: (newVal) => {
      viewTypeCookie.value = newVal
    }
  })

  return gridOrList
}
