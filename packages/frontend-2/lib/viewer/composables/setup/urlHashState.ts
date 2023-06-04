import { writableAsyncComputed } from '~~/lib/common/composables/async'
import { useRouteHashState } from '~~/lib/common/composables/url'
import type { InjectableViewerState } from '~~/lib/viewer/composables/setup'

export enum ViewerHashStateKeys {
  FocusedThreadId = 'threadId',
  Diff = 'diff'
}

export function setupUrlHashState(): InjectableViewerState['urlHashState'] {
  const { hashState } = useRouteHashState()

  const focusedThreadId = writableAsyncComputed({
    get: () => hashState.value[ViewerHashStateKeys.FocusedThreadId] || null,
    set: async (newVal) => {
      await hashState.update({
        ...hashState.value,
        [ViewerHashStateKeys.FocusedThreadId]: newVal
      })
    },
    initialState: null
  })

  const diff = writableAsyncComputed({
    get: () => hashState.value[ViewerHashStateKeys.Diff],
    set: async (newVal) =>
      await hashState.update({
        ...hashState.value,
        [ViewerHashStateKeys.Diff]: newVal
      }),
    initialState: null
  })

  return {
    focusedThreadId,
    diff
  }
}
