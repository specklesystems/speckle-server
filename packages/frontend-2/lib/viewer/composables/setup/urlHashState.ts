import { useRouteHashState } from '~~/lib/common/composables/url'
import type { InjectableViewerState } from '~~/lib/viewer/composables/setup'

export enum ViewerHashStateKeys {
  FocusedThreadId = 'threadId',
  Compare = 'compare'
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

  const compare = computed({
    get: () =>
      hashState.value[ViewerHashStateKeys.Compare]?.toLowerCase() === 'true' || false,
    set: (newVal) =>
      (hashState.value = {
        ...hashState.value,
        [ViewerHashStateKeys.Compare]: newVal ? 'true' : null
      })
  })
  return {
    focusedThreadId,
    compare
  }
}
