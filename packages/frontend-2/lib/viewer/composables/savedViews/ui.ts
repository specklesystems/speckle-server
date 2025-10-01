import { useMutationLoading } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import {
  ViewPositionInputType,
  type UseDraggableView_SavedViewFragment,
  type UseDraggableViewTargetGroup_SavedViewGroupFragment,
  type UseDraggableViewTargetView_SavedViewFragment
} from '~/lib/common/generated/gql/graphql'
import { ensureError, safeParse } from '@speckle/shared'
import { has, isObjectLike } from 'lodash-es'
import { useUpdateSavedView } from '~/lib/viewer/composables/savedViews/management'
import { isUngroupedGroup } from '@speckle/shared/dist/esm/saved-views/index.js'

const isDraggableView = (view: unknown): view is UseDraggableView_SavedViewFragment =>
  isObjectLike(view) && has(view, 'id') && has(view, 'permissions.canUpdate')

// Shared state to track which view is currently being dragged
const currentlyDraggingViewId = ref<string | null>(null)

graphql(`
  fragment UseDraggableView_SavedView on SavedView {
    id
    projectId
    name
    position
    group {
      id
    }
    permissions {
      canMove {
        ...FullPermissionCheckResult
      }
    }
    ...UseUpdateSavedView_SavedView
  }
`)

export const useDraggableView = (params: {
  view: Ref<UseDraggableView_SavedViewFragment>
}) => {
  const isDragging = ref(false)
  const isLoading = useMutationLoading()

  const classes = computed(() => {
    const classParts: string[] = ['draggable-view']

    if (isDragging.value) {
      classParts.push('opacity-50 scale-95')
    }

    return classParts.join(' ')
  })

  const vOn = {
    dragstart: (event: DragEvent) => {
      if (!event.dataTransfer) return
      if (!params.view.value.permissions.canMove.authorized || isLoading.value) {
        event.preventDefault()
        return
      }

      isDragging.value = true
      currentlyDraggingViewId.value = params.view.value.id
      event.dataTransfer.setData('application/json', JSON.stringify(params.view.value))
      event.dataTransfer.effectAllowed = 'move'

      const imageTarget =
        (event.target as HTMLElement).closest('.draggable-view') ||
        (event.target as HTMLElement)
      event.dataTransfer.setDragImage(imageTarget, 0, 0)
    },
    dragend: () => {
      isDragging.value = false
      currentlyDraggingViewId.value = null
    }
  }

  return {
    classes,
    on: vOn
  }
}

graphql(`
  fragment UseDraggableViewTargetView_SavedView on SavedView {
    id
    name
    position
    group {
      id
    }
  }
`)

export const useDraggableViewTargetView = (params: {
  view: Ref<UseDraggableViewTargetView_SavedViewFragment>
  onMoved?: () => void
}) => {
  const isDragOver = ref(false)
  const dragCounter = ref(0)
  const dropPosition = ref<'top' | 'bottom' | null>(null)
  const { triggerNotification } = useGlobalToast()
  const updateView = useUpdateSavedView()

  const vOn = {
    dragover: (event: DragEvent) => {
      if (!event.dataTransfer) return

      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'

      // Don't show drop indicator if dragging over itself
      if (currentlyDraggingViewId.value === params.view.value.id) {
        dropPosition.value = null
        return
      }

      // Track drop position for visual feedback
      const targetRect = (event.currentTarget as HTMLElement).getBoundingClientRect()
      const yPosition = event.clientY - targetRect.top
      const isTopHalf = yPosition < targetRect.height / 2
      dropPosition.value = isTopHalf ? 'top' : 'bottom'
    },
    drop: async (event: DragEvent) => {
      if (!event.dataTransfer) return

      event.preventDefault()
      isDragOver.value = false
      dragCounter.value = 0
      dropPosition.value = null

      try {
        const data = event.dataTransfer.getData('application/json')
        const view = safeParse(data, isDraggableView)
        if (!view) return

        // check if same view
        if (view.id === params.view.value.id) {
          return
        }

        // See whether view was dropped closer to top or bottom to figure out
        // whether to put it before or after the target view
        const targetRect = (event.target as HTMLElement).getBoundingClientRect()
        const dropYPosition = event.clientY - targetRect.top
        const dropInTopHalf = dropYPosition < targetRect.height / 2

        await updateView(
          {
            view,
            input: {
              id: view.id,
              projectId: view.projectId,
              groupId: params.view.value.group.id,
              position: {
                type: ViewPositionInputType.Between,
                ...(dropInTopHalf
                  ? { beforeViewId: params.view.value.id }
                  : { afterViewId: params.view.value.id })
              }
            }
          },
          {
            skipToast: true,
            onFullResult: (res, success) => {
              if (success) {
                // no notification here, this can get noisy
                params.onMoved?.()
              } else {
                triggerNotification({
                  type: ToastNotificationType.Danger,
                  title: 'Failed to move view',
                  description: getFirstGqlErrorMessage(res?.errors)
                })
              }
            }
          }
        )
      } catch (e) {
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'Failed to move view',
          description: ensureError(e).message
        })
      }
    },
    dragenter: (event: DragEvent) => {
      event.preventDefault()
      dragCounter.value++
      isDragOver.value = true
    },
    dragleave: () => {
      dragCounter.value--
      if (dragCounter.value === 0) {
        isDragOver.value = false
        dropPosition.value = null
      }
    }
  }

  const classes = computed(() => {
    const classParts: string[] = ['draggable-view-target']

    // No background color during drag - using drop position indicator line instead

    return classParts.join(' ')
  })

  return {
    on: vOn,
    classes,
    dropPosition: readonly(dropPosition),
    isDragOver: readonly(isDragOver)
  }
}

graphql(`
  fragment UseDraggableViewTargetGroup_SavedViewGroup on SavedViewGroup {
    id
    title
  }
`)

export const useDraggableViewTargetGroup = (params: {
  group: Ref<UseDraggableViewTargetGroup_SavedViewGroupFragment>
  onMoved?: () => void
}) => {
  const isDragOver = ref(false)
  const dragCounter = ref(0)
  const { triggerNotification } = useGlobalToast()
  const updateView = useUpdateSavedView()

  const vOn = {
    dragover: (event: DragEvent) => {
      if (!event.dataTransfer) return

      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'

      // Only show drop indicator if hovering over the title button (DisclosureButton)
      const target = event.target as HTMLElement
      const isOverTitleButton = target.closest('button[class*="group/disclosure"]')
      if (!isOverTitleButton) {
        // We're over the content area, not the title - don't show group outline
        isDragOver.value = false
        return
      }
    },
    drop: async (event: DragEvent) => {
      if (!event.dataTransfer) return

      event.preventDefault()
      isDragOver.value = false
      dragCounter.value = 0

      try {
        const data = event.dataTransfer.getData('application/json')
        const view = safeParse(data, isDraggableView)
        if (!view) return

        const sameGroupId = view.group.id === params.group.value.id
        const bothUngrouped =
          isUngroupedGroup(view.group.id) && isUngroupedGroup(params.group.value.id)

        // "Same" ungrouped group can exist as different cache entries/IDs, due to resourceIds being changed?
        if (sameGroupId || bothUngrouped) {
          return
        }

        await updateView(
          {
            view,
            input: {
              id: view.id,
              projectId: view.projectId,
              groupId: params.group.value.id
            }
          },
          {
            skipToast: true,
            onFullResult: (res, success) => {
              if (success) {
                triggerNotification({
                  type: ToastNotificationType.Success,
                  title: `Moved "${view.name}" to "${params.group.value.title}"`
                })
                params.onMoved?.()
              } else {
                triggerNotification({
                  type: ToastNotificationType.Danger,
                  title: 'Failed to move view',
                  description: getFirstGqlErrorMessage(res?.errors)
                })
              }
            }
          }
        )
      } catch (e) {
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'Failed to move view',
          description: ensureError(e).message
        })
      }
    },
    dragenter: (event: DragEvent) => {
      event.preventDefault()
      dragCounter.value++

      // Only set isDragOver if we're entering the title button
      const target = event.target as HTMLElement
      const isOverTitleButton = target.closest('button[class*="group/disclosure"]')
      if (isOverTitleButton) {
        isDragOver.value = true
      }
    },
    dragleave: () => {
      dragCounter.value--
      if (dragCounter.value === 0) {
        isDragOver.value = false
      }
    }
  }

  const classes = computed(() => {
    const classParts: string[] = ['draggable-view-target']

    if (isDragOver.value) {
      classParts.push('rounded-md ring-2 ring-primary ring-opacity-50 bg-primary/5')
    }

    return classParts.join(' ')
  })

  return {
    on: vOn,
    classes
  }
}
