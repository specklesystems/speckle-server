import { writableAsyncComputed } from '~~/lib/common/composables/async'
import { useRouteHashState } from '~~/lib/common/composables/url'
import type { InjectableViewerState } from '~~/lib/viewer/composables/setup'
import { useDiffBuilderUtilities } from '~~/lib/viewer/composables/setup/diff'
import { deserializeEmbedOptions } from '~~/lib/viewer/composables/setup/embed'

export enum ViewerHashStateKeys {
  FocusedThreadId = 'threadId',
  Diff = 'diff',
  EmbedOptions = 'embed'
}

export function setupUrlHashState(): InjectableViewerState['urlHashState'] {
  const { hashState } = useRouteHashState()
  const { deserializeDiffCommand, serializeDiffCommand } = useDiffBuilderUtilities()

  const focusedThreadId = writableAsyncComputed({
    get: () => hashState.value[ViewerHashStateKeys.FocusedThreadId] || null,
    set: async (newVal) => {
      await hashState.update({
        ...hashState.value,
        [ViewerHashStateKeys.FocusedThreadId]: newVal
      })
    },
    initialState: null,
    asyncRead: false
    // debugging: { log: { name: 'focusedThreadId' } }
  })

  const diff = writableAsyncComputed({
    get: () => {
      const urlValue = hashState.value[ViewerHashStateKeys.Diff]
      return deserializeDiffCommand(urlValue)
    },
    set: async (newVal) =>
      await hashState.update({
        ...hashState.value,
        [ViewerHashStateKeys.Diff]: newVal ? serializeDiffCommand(newVal) : null
      }),
    initialState: null,
    asyncRead: false
  })

  const embedOptions = writableAsyncComputed({
    get: () => {
      const embedString = hashState.value[ViewerHashStateKeys.EmbedOptions]
      return deserializeEmbedOptions(embedString)
    },
    set: async (newOptions) => {
      const embedString = newOptions ? JSON.stringify(newOptions) : null
      await hashState.update({
        ...hashState.value,
        [ViewerHashStateKeys.EmbedOptions]: embedString
      })
    },
    initialState: null,
    asyncRead: false
  })

  return {
    focusedThreadId,
    diff,
    embedOptions
  }
}
