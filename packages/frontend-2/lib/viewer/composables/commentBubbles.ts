import { CSSProperties, Ref } from 'vue'
import { Nullable } from '@speckle/shared'
import {
  LoadedCommentThread,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { graphql } from '~~/lib/common/generated/gql'
import { reduce } from 'lodash-es'
import { Vector3 } from 'three'
import { IntersectionQuery, PointQuery } from '@speckle/viewer'
import { useViewerCameraTracker } from '~~/lib/viewer/composables/viewer'

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
    },
    viewer: { instance: viewer }
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

  const updatePositions = () => {
    if (!parentEl.value) return

    for (const comment of Object.values(commentThreads.value)) {
      if (!comment.data) return
      const commentLocationData = comment.data.location as {
        x: number
        y: number
        z: number
      }
      const location = new Vector3(
        commentLocationData.x,
        commentLocationData.y,
        commentLocationData.z
      )

      // Calculate position in 3D space
      const locationProjection = viewer.query<PointQuery>({
        point: location,
        operation: 'Project'
      })
      const commentLocation = viewer.Utils.NDCToScreen(
        locationProjection.x,
        locationProjection.y,
        parentEl.value.clientWidth,
        parentEl.value.clientHeight
      )

      // Calculate occlusion
      const commentOcclusion = viewer.query<IntersectionQuery>({
        point: location,
        tolerance: 0.001,
        operation: 'Occlusion'
      })
      comment.isOccluded = !!commentOcclusion.objects?.length

      // Calculate CSS style
      const commentStyle = comment.style
      commentStyle.transition = 'all 0.1s ease'
      commentStyle.transform = `translate(-50%, -50%) translate(${commentLocation.x}px,${commentLocation.y}px)`
      commentStyle.opacity = comment.isOccluded ? '0.5' : '1.0'
    }
  }

  useViewerCameraTracker(() => updatePositions())

  return {
    commentThreads
  }
}
