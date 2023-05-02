<template>
  <div class="relative">
    <div
      class="absolute pointer-events-auto"
      :style="{
        ...modelValue.style,
        opacity: 1
      }"
    >
      <div ref="threadActivator" class="relative">
        <button
          :class="`
        ${
          modelValue.isOccluded && !isExpanded
            ? 'grayscale opacity-80 hover:grayscale-0 hover:opacity-100'
            : ''
        }
        ${isExpanded ? 'outline outline-2 outline-primary' : ''}  
        transition bg-foundation shadow hover:shadow-xl flex -space-x-2 items-center p-[2px] rounded-tr-full rounded-tl-full rounded-br-full`"
          @click="onThreadClick"
        >
          <!-- 
            Note: Unsure wether to display just a checkmark for "resolved" threads, or the author list and the checkmark. 
            Both optinos are viable, see below. Uncomment to test. 
          -->
          <!-- <UserAvatarGroup :users="threadAuthors" /> -->
          <UserAvatarGroup v-if="!modelValue.archived" :users="threadAuthors" />
          <CheckCircleIcon v-if="modelValue.archived" class="w-8 h-8 text-primary" />
        </button>
      </div>
    </div>
    <div
      v-if="isExpanded"
      ref="threadContainer"
      class="fixed hover:bg-foundation bg-white/80 dark:bg-neutral-800/90 dark:hover:bg-neutral-800 backdrop-blur-sm rounded-lg shadow-md z-50 pointer-events-auto"
      :style="threadStyle"
    >
      <div class="relative w-80 flex pt-3">
        <div class="flex-grow flex items-center">
          <FormButton
            v-tippy="'Previous'"
            size="sm"
            :icon-left="ChevronLeftIcon"
            text
            hide-text
            @click="emit('prev', props.modelValue)"
          ></FormButton>
          <FormButton
            v-tippy="'Next'"
            size="sm"
            :icon-left="ChevronRightIcon"
            text
            hide-text
            @click="emit('next', props.modelValue)"
          ></FormButton>
          <div
            ref="handle"
            class="flex-grow cursor-move text-tiny rounded-xl bg-blue-500/0 hover:bg-blue-500/10 transition h-3"
          >
            <!-- handle {{ isDragged }} -->
            <!-- {{ initialDragPosition }} -->
          </div>
          <FormButton
            v-show="isDragged"
            v-tippy="'Pop In'"
            size="sm"
            :icon-left="ArrowTopRightOnSquareIcon"
            text
            hide-text
            class="rotate-180"
            @click="isDragged = false"
          ></FormButton>
        </div>
        <div>
          <FormButton
            v-tippy="modelValue.archived ? 'Unresolve' : 'Resolve'"
            size="sm"
            :icon-left="modelValue.archived ? CheckCircleIcon : CheckCircleIconOutlined"
            text
            hide-text
            :color="modelValue.archived ? 'default' : 'default'"
            :disabled="!canArchiveOrUnarchive"
            @click="toggleCommentResolvedStatus()"
          ></FormButton>
          <FormButton
            v-tippy="'Copy link'"
            size="sm"
            :icon-left="LinkIcon"
            text
            hide-text
            @click="onCopyLink"
          ></FormButton>
          <FormButton
            size="sm"
            :icon-left="XMarkIcon"
            text
            hide-text
            @click="changeExpanded(false)"
          ></FormButton>
        </div>
      </div>
      <div class="relative w-80 flex flex-col">
        <div
          ref="commentsContainer"
          class="max-h-[500px] overflow-y-auto simple-scrollbar flex flex-col space-y-1 pr-1"
        >
          <div
            v-if="!isThreadResourceLoaded"
            class="pl-3 pr-1 py-1 mt-2 flex items-center justify-between text-xs text-primary bg-primary-muted"
          >
            <span>Conversation started in a different version.</span>
            <ExclamationCircleIcon class="w-4 h-4" />
          </div>
          <ViewerAnchoredPointThreadComment
            v-for="comment in comments"
            :key="comment.id"
            :comment="comment"
            :project-id="projectId"
            @mounted="onCommentMounted"
          />
        </div>
        <div
          v-if="isTypingMessage"
          class="bg-foundation rounded-full w-full p-2 caption mt-2"
        >
          {{ isTypingMessage }}
        </div>
        <ViewerAnchoredPointThreadNewReply
          v-if="!modelValue.archived"
          :model-value="modelValue"
          class="mt-2"
          @submit="onNewReply"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  LinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/vue/24/solid'
import { CheckCircleIcon as CheckCircleIconOutlined } from '@heroicons/vue/24/outline'
import { ExclamationCircleIcon } from '@heroicons/vue/20/solid'
import { ensureError, Nullable, Roles, SpeckleViewer } from '@speckle/shared'
import { onKeyDown, useClipboard, useDraggable } from '@vueuse/core'
import { scrollToBottom } from '~~/lib/common/helpers/dom'
import { useViewerThreadTypingTracking } from '~~/lib/viewer/composables/activity'
import {
  CommentBubbleModel,
  useAnimatingEllipsis
} from '~~/lib/viewer/composables/commentBubbles'
import {
  useArchiveComment,
  useMarkThreadViewed
} from '~~/lib/viewer/composables/commentManagement'
import {
  useInjectedViewerLoadedResources,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { ResourceType } from '~~/lib/common/generated/gql/graphql'
import { getLinkToThread } from '~~/lib/viewer/helpers/comments'
import { NumericPropertyInfo, PropertyInfo } from '@speckle/viewer'
import {
  useFilterUtilities,
  useSectionBoxUtilities
} from '~~/lib/viewer/composables/ui'

const emit = defineEmits<{
  (e: 'update:modelValue', v: CommentBubbleModel): void
  (e: 'update:expanded', v: boolean): void
  (e: 'next', v: CommentBubbleModel): void
  (e: 'prev', v: CommentBubbleModel): void
}>()

const props = defineProps<{
  modelValue: CommentBubbleModel
}>()

const threadId = computed(() => props.modelValue.id)
const { copy } = useClipboard()
const { activeUser } = useActiveUser()
const archiveComment = useArchiveComment()
const { triggerNotification } = useGlobalToast()
const {
  resources: {
    response: { project }
  }
} = useInjectedViewerState()

const {
  projectId,
  viewer: {
    metadata: { availableFilters: allFilters }
  }
} = useInjectedViewerState()
const { sectionBoxOff } = useSectionBoxUtilities()
const {
  removePropertyFilter,
  setPropertyFilter,
  applyPropertyFilter,
  unApplyPropertyFilter,
  resetFilters,
  isolateObjects,
  hideObjects
} = useFilterUtilities()

const markThreadViewed = useMarkThreadViewed()
const { usersTyping } = useViewerThreadTypingTracking(threadId)
const { ellipsis, controls } = useAnimatingEllipsis()

const commentsContainer = ref(null as Nullable<HTMLElement>)
const threadContainer = ref(null as Nullable<HTMLElement>)
const threadActivator = ref(null as Nullable<HTMLElement>)

const handle = ref(null as Nullable<HTMLElement>)
const justCreatedReply = ref(false)

const comments = computed(() => [
  props.modelValue,
  ...props.modelValue.replies.items.slice().reverse()
])

const viewerState = computed(() => {
  return SpeckleViewer.ViewerState.isSerializedViewerState(props.modelValue.viewerState)
    ? props.modelValue.viewerState
    : null
})

// Note: conflicted with dragging styles, so took it out temporarily
// const { style } = useExpandedThreadResponsiveLocation({
//   threadContainer,
//   width: 320
// })

const isExpanded = computed(() => props.modelValue.isExpanded)

const isTypingMessage = computed(() => {
  if (!usersTyping.value.length) return null
  return usersTyping.value.length > 1
    ? `${usersTyping.value.map((u) => u.userName).join(', ')} are typing${
        ellipsis.value
      }`
    : `${usersTyping.value[0].userName} is typing${ellipsis.value}`
})

const isViewed = computed(() => !!props.modelValue.viewedAt)

const initialDragPosition = computed(() => {
  return {
    x: props.modelValue.style.x as number,
    y: props.modelValue.style.y as number
  }
})

const isDragged = ref(false)
const { x, y } = useDraggable(threadContainer, {
  stopPropagation: true,
  handle, // note if linting error, this actually exists and is ok FFS
  initialValue: initialDragPosition,
  onStart() {
    isDragged.value = true
  },
  onEnd() {
    // todo
  }
})

const threadStyle = computed(() => {
  if (!threadActivator.value) return props.modelValue.style
  const activatorRect = threadActivator.value?.getBoundingClientRect()
  const xOffset = isDragged.value
    ? x.value
    : (props.modelValue.style.x as number) + activatorRect.width + 20
  const threadHeigth = threadContainer.value?.getBoundingClientRect().height || 0
  const yOffset = isDragged.value
    ? y.value
    : (props.modelValue.style.y as number) - threadHeigth / 2
  const transition = isDragged.value ? 'none' : props.modelValue.style.transition
  return {
    ...props.modelValue.style,
    opacity: 1,
    transition,
    transform: `translate(${xOffset}px,${yOffset}px)`
  }
})

// // TODO: will be used
// const threadEmoji = computed(() => {
//   const cleanVal = props.modelValue.rawText.trim()
//   return emojis.includes(cleanVal) ? cleanVal : undefined
// })

const threadAuthors = computed(() => {
  const authors = [props.modelValue.author]
  for (const author of props.modelValue.replyAuthors.items) {
    if (!authors.find((u) => u.id === author.id)) authors.push(author)
  }
  return authors
})

const changeExpanded = (newVal: boolean) => {
  emit('update:modelValue', {
    ...props.modelValue,
    isExpanded: newVal
  })
  emit('update:expanded', newVal)
}

const canArchiveOrUnarchive = computed(
  () =>
    activeUser.value &&
    (props.modelValue.author.id === activeUser.value.id ||
      project.value?.role === Roles.Stream.Owner)
)

const { resourceItems } = useInjectedViewerLoadedResources()

const isThreadResourceLoaded = computed(() => {
  const thread = props.modelValue
  const loadedResources = resourceItems.value
  const resourceLinks = thread.resources

  const objectLinks = resourceLinks
    .filter((l) => l.resourceType === ResourceType.Object)
    .map((l) => l.resourceId)
  const commitLinks = resourceLinks
    .filter((l) => l.resourceType === ResourceType.Commit)
    .map((l) => l.resourceId)

  if (loadedResources.some((lr) => objectLinks.includes(lr.objectId))) return true
  if (loadedResources.some((lr) => lr.versionId && commitLinks.includes(lr.versionId)))
    return true

  return false
})

const toggleCommentResolvedStatus = async () => {
  await archiveComment(props.modelValue.id, !props.modelValue.archived)
  triggerNotification({
    description: `Thread ${props.modelValue.archived ? 'reopened.' : 'resolved.'}`,
    type: ToastNotificationType.Info
  })
}

const onNewReply = () => {
  justCreatedReply.value = true
}

const onCommentMounted = () => {
  if (!justCreatedReply.value) return

  const el = commentsContainer.value
  if (!el) return

  scrollToBottom(el)
  justCreatedReply.value = false
}

const onThreadClick = () => {
  changeExpanded(!isExpanded.value)
}

const onCopyLink = async () => {
  if (process.server) return
  const url = getLinkToThread(projectId.value, props.modelValue)
  if (!url) return

  try {
    await copy(new URL(url, window.location.origin).toString())
  } catch (e) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Thread link copy failed',
      description: ensureError(e).message
    })
    throw e
  }

  triggerNotification({
    type: ToastNotificationType.Info,
    title: 'Thread link copied'
  })
}

onKeyDown('Escape', () => {
  if (isExpanded.value) {
    changeExpanded(false)
  }
})

// onKeyDown('ArrowRight', () => (isExpanded.value ? emit('prev', props.modelValue) : ''))
// onKeyDown('ArrowLeft', () => (isExpanded.value ? emit('next', props.modelValue) : ''))
const shouldSetFiltersUpPostLoad = ref(false)

const setupFullFilters = () => {
  if (!viewerState.value) return

  // TODO: Restore more things @dim
  const propertyInfoKey = viewerState.value.ui.filters.propertyFilter.key
  const passMin = viewerState.value.viewer.metadata.filteringState?.passMin
  const passMax = viewerState.value.viewer.metadata.filteringState?.passMax

  if (propertyInfoKey) {
    removePropertyFilter()
    unApplyPropertyFilter()
    const filter = allFilters.value?.find(
      (f: PropertyInfo) => f.key === propertyInfoKey
    )
    if (!filter) {
      shouldSetFiltersUpPostLoad.value = true
      console.warn('Error setting comment filter: no filter with that key found. ')
      return
    }

    if (passMin || passMax) {
      const numericFilter = { ...filter } as NumericPropertyInfo
      numericFilter.passMin = passMin || numericFilter.min
      numericFilter.passMax = passMax || numericFilter.max
      setPropertyFilter(numericFilter)
      applyPropertyFilter()
      return // Hiding objects is handled by the numeric filter pass min/max
    }
    setPropertyFilter(filter)
    applyPropertyFilter()
    // do not return, let's go through the vis of objects
  }

  hideOrIsolateObjects()
}

const hideOrIsolateObjects = () => {
  if (!viewerState.value) return

  const isolatedIds = viewerState.value.ui.filters.isolatedObjectIds
  const hiddenIds = viewerState.value.ui.filters.hiddenObjectIds

  if (isolatedIds.length) isolateObjects(isolatedIds, { replace: true })
  if (hiddenIds.length) hideObjects(hiddenIds, { replace: true })
}

watch(
  () => <const>[isExpanded.value, isViewed.value],
  (newVals, oldVals) => {
    const [newIsExpanded, newIsViewed] = newVals
    const [oldIsExpanded] = oldVals || [false]

    if (newIsExpanded && newIsExpanded !== oldIsExpanded && !newIsViewed) {
      markThreadViewed(projectId.value, props.modelValue.id)
    }

    if (!newIsExpanded && viewerState.value?.ui.sectionBox) {
      sectionBoxOff() // turn off section box if a comment had a section box
    }

    if (!newIsExpanded) {
      isDragged.value = false
    }

    // TODO: unsure whether this should make its way into a composable of some sorts.
    // Behaviour:
    // - any time we open a comment, we want to set its filters up;
    // - any time we close a comment, we reset its filters
    // We want to do this when the viewer busy event is done with, alternatively when the
    // all filters is populated...

    // If a thread is no longer expanded and it had filters, reset them to default.
    const isolatedIds = viewerState.value?.ui.filters.isolatedObjectIds || []
    const hiddenIds = viewerState.value?.ui.filters.hiddenObjectIds || []
    const propertyInfoKey = viewerState.value?.ui.filters.propertyFilter.key
    const hasFilters = isolatedIds.length || hiddenIds.length || propertyInfoKey
    if (!newIsExpanded && hasFilters) {
      resetFilters()
      return
    }

    // If a thread is expanded and has filters, set them up.
    if (hasFilters && newIsExpanded) {
      // If we do not have a custom filter for this thread, it means
      // we might only have hidden/isolated objects.
      if (!propertyInfoKey) {
        hideOrIsolateObjects()
        return
      }

      // If we do have a 'propertyInfoKey', try to find it in the all filters. It will be there,
      // unless we're freshly opening a model and a thread at the same time.
      const filter = allFilters.value?.find(
        (f: PropertyInfo) => f.key === propertyInfoKey
      )
      // If we don't find it, set a flag for the watcher below to pick up.
      if (!filter) shouldSetFiltersUpPostLoad.value = true
      // Full speed ahead otherwise.
      else setupFullFilters()
    }
  },
  { immediate: true } // for triggering also when a comment is opened because of a thread link
)

watch(allFilters, (newValue) => {
  if (!shouldSetFiltersUpPostLoad.value) return
  const filter = newValue?.find(
    (f: PropertyInfo) => f.key === viewerState.value?.ui.filters.propertyFilter.key
  )
  if (!filter) return
  shouldSetFiltersUpPostLoad.value = false
  // NOTE: we still need to give the viewer some time to do its thing.
  // TODOs:
  // - check with Alex if there is a way to more accurately report the end of viewer operations.
  //   (I get WebGL-000035F405EE6900] GL_INVALID_FRAMEBUFFER_OPERATION: Framebuffer is incomplete: Attachment has zero size., and WebGL-000035F405EE6900] GL_INVALID_FRAMEBUFFER_OPERATION: Draw framebuffer is incomplete, and REE.Material: 'vertexColors' parameter is undefined. errors if model is not fully 'loaded')
  // - check if viewerBusy might be a better option (it's not, tried below.)
  setTimeout(setupFullFilters, 2000)
})

// watch(viewerBusy, (newVal) => {
//   if (newVal) return
//   if (!shouldSetFiltersUpPostLoad.value) return
//   const filter = allFilters.value?.find(
//     (f: PropertyInfo) => f.key === props.modelValue.data?.filters.propertyInfoKey
//   )
//   if (!filter) return
//   shouldSetFiltersUpPostLoad.value = false
//   setupFullFilters()
// })

watch(
  () => usersTyping.value.length > 1,
  (areUsersTyping) => {
    if (areUsersTyping) {
      controls.resume()
    } else {
      controls.pause()
    }
  }
)
</script>
