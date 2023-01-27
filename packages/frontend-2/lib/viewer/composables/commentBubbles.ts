import { CSSProperties, Ref } from 'vue'
import { Nullable, Optional } from '@speckle/shared'
import {
  LoadedCommentThread,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { graphql } from '~~/lib/common/generated/gql'
import { reduce } from 'lodash-es'
import { Vector3 } from 'three'
import { useSelectionEvents } from '~~/lib/viewer/composables/viewer'
import { useViewerAnchoredPoints } from '~~/lib/viewer/composables/anchorPoints'

// TODO: Abstract 3D anchor point calculation algorithm (same for user activity & comment bubbles)
// TODO: ...but do "New thread" bubble first, cause that might be a bit different

graphql(`
  fragment ViewerCommentBubblesData on Comment {
    id
    data {
      location
      camPos
      sectionBox
      selection
      filters {
        hiddenIds
        isolatedIds
        propertyInfoKey
        passMax
        passMin
        sectionBox
      }
    }
  }
`)

type ViewerNewThreadButtonState = {
  isExpanded: boolean
  isVisible: boolean
  isOccluded: boolean
  style: Partial<CSSProperties>
  clickLocation: Nullable<Vector3>
}

export function useViewerNewThreadBubble(params: {
  parentEl: Ref<Nullable<HTMLElement>>
}) {
  const { parentEl } = params

  const buttonState = ref({
    isExpanded: false,
    isVisible: false,
    isOccluded: false,
    clickLocation: null,
    style: {}
  } as ViewerNewThreadButtonState)

  const { updatePositions } = useViewerAnchoredPoints({
    parentEl,
    points: computed(() => buttonState.value),
    pointLocationGetter: (b) => b.clickLocation,
    updatePositionCallback: (state, result) => {
      state.isOccluded = result.isOccluded
      state.style = {
        ...state.style,
        ...result.style,
        opacity: state.isOccluded ? '0.8' : '1.0',
        transition: 'all 0.1s ease'
      }
    }
  })

  useSelectionEvents({
    singleClickCallback: (event) => {
      buttonState.value.isExpanded = false
      if (!event || !event.hits.length) {
        buttonState.value.isVisible = false
        buttonState.value.clickLocation = null
        return
      }

      buttonState.value.clickLocation = event.hits[0].point.clone()
      buttonState.value.isVisible = true
      updatePositions()
    }
  })

  return { buttonState }
}

type CommentBubbleModel = LoadedCommentThread & {
  isExpanded: boolean
  isHovered: boolean
  isBouncing: boolean
  isOccluded: boolean
  style: Partial<CSSProperties>
}

export function useViewerCommentBubbles(params: {
  parentEl: Ref<Nullable<HTMLElement>>
}) {
  const { parentEl } = params
  const {
    resources: {
      response: { commentThreads: commentThreadsBase }
    }
  } = useInjectedViewerState()

  const commentThreads = ref({} as Record<string, CommentBubbleModel>)
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
                  isExpanded: false,
                  isHovered: false,
                  isBouncing: false,
                  isOccluded: false,
                  style: {}
                }),
            ...item
          }
          return results
        },
        {} as Record<string, CommentBubbleModel>
      )
      commentThreads.value = newModels
    },
    { immediate: true }
  )

  useViewerAnchoredPoints({
    parentEl,
    points: computed(() => Object.values(commentThreads.value)),
    pointLocationGetter: (t) => t.data?.location as Optional<Vector3>,
    updatePositionCallback: (thread, result) => {
      thread.isOccluded = result.isOccluded
      thread.style = {
        ...thread.style,
        ...result.style,
        opacity: thread.isOccluded ? '0.5' : '1.0',
        transition: 'all 0.1s ease'
      }
    }
  })

  return {
    commentThreads
  }
}
