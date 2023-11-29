import type { CommentBubbleModel } from '~~/lib/viewer/composables/commentBubbles'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import type { InitialStateWithUrlHashState } from '~~/lib/viewer/composables/setup'
import { useSelectionEvents } from '~~/lib/viewer/composables/viewer'
import { reduce } from 'lodash-es'
import { SpeckleViewer } from '@speckle/shared'

export function setupViewerCommentBubbles(
  options?: Partial<{
    state: InitialStateWithUrlHashState
  }>
) {
  const {
    resources: {
      response: { commentThreads: commentThreadsBase }
    },
    urlHashState: { focusedThreadId }
  } = options?.state || useInjectedViewerState()

  const newThreadEditor = ref(false)
  const commentThreads = ref({} as Record<string, CommentBubbleModel>)
  const openThread = computed(() => {
    const ot = Object.values(commentThreads.value).find(
      (t) => t.id === focusedThreadId.value
    )
    return ot
  })

  useSelectionEvents(
    {
      singleClickCallback: (eventInfo) => {
        if ((eventInfo && eventInfo?.hits.length === 0) || !eventInfo) {
          // Close open thread
          // Object.values(commentThreads.value).forEach((t) => (t.isExpanded = false))
        }
      }
    },
    { state: options?.state }
  )

  // Shallow watcher, only for mapping `commentThreadsBase` -> `commentThreads`
  watch(
    commentThreadsBase,
    (newCommentThreads) => {
      const newModels = reduce(
        newCommentThreads,
        (results, item) => {
          const id = item.id
          results[id] = {
            ...(commentThreads.value[id]
              ? commentThreads.value[id]
              : {
                  isOccluded: false,
                  style: {}
                }),
            ...item,
            viewerState: SpeckleViewer.ViewerState.isSerializedViewerState(
              item.viewerState
            )
              ? item.viewerState
              : null
          }
          return results
        },
        {} as Record<string, CommentBubbleModel>
      )
      commentThreads.value = newModels
    },
    { immediate: true }
  )

  watch(newThreadEditor, async (isNewThread, oldIsNewThread) => {
    if (isNewThread && !!isNewThread !== !!oldIsNewThread) {
      await focusedThreadId.update(null)
    }
  })

  return {
    commentThreads,
    openThread,
    newThreadEditor
  }
}
