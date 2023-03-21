import { useRouteHashState } from '~~/lib/common/composables/url'
import type { InjectableViewerState } from '~~/lib/viewer/composables/setup'

export enum ViewerHashStateKeys {
  FocusedThreadId = 'threadId'
}

export function setupUrlHashState(): InjectableViewerState['urlHashState'] {
  const { hashState } = useRouteHashState()

  const focusedThreadId = computed({
    get: () => hashState.value[ViewerHashStateKeys.FocusedThreadId] || null,
    set: (newVal) =>
      (hashState.value = {
        ...hashState.value,
        [ViewerHashStateKeys.FocusedThreadId]: newVal
      })
  })

  return {
    focusedThreadId
  }
}
