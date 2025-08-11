import type { Nullable } from '@speckle/shared'
import {
  parseSavedViewUrlSettings,
  serializeSavedViewUrlSettings,
  type SavedViewUrlSettings
} from '~/lib/viewer/helpers/savedViews'
import { writableAsyncComputed } from '~~/lib/common/composables/async'
import { useRouteHashState } from '~~/lib/common/composables/url'
import type { InjectableViewerState } from '~~/lib/viewer/composables/setup'
import { useDiffBuilderUtilities } from '~~/lib/viewer/composables/setup/diff'

export enum ViewerHashStateKeys {
  FocusedThreadId = 'threadId',
  Diff = 'diff',
  EmbedOptions = 'embed',
  SavedView = 'savedView'
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

  const savedView = writableAsyncComputed<Nullable<SavedViewUrlSettings>>({
    get: () => {
      const urlVal = hashState.value[ViewerHashStateKeys.SavedView]
      return parseSavedViewUrlSettings(urlVal)
    },
    set: async (newVal) => {
      const serialized = newVal ? serializeSavedViewUrlSettings(newVal) : null
      await hashState.update({
        ...hashState.value,
        [ViewerHashStateKeys.SavedView]: serialized
      })
    },
    initialState: null,
    asyncRead: false
  })

  return {
    focusedThreadId,
    diff,
    savedView
  }
}
