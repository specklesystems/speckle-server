<template>
  <ViewerCommentsPortalOrDiv class="relative" to="bottomPanel">
    <ViewerControlsRight
      v-if="isGreaterThanSm"
      :sidebar-open="sidebarOpen && shouldRenderSidebar"
      :sidebar-width="sidebarWidth"
    />
    <ViewerSidebar
      v-if="shouldRenderSidebar"
      :open="sidebarOpen"
      @close="onClose"
      @width-change="sidebarWidth = $event"
    >
      <template #title>
        <div class="flex items-center gap-x-2">
          <span>Selected</span>
          <CommonBadge v-if="objects.length > 1" rounded>
            {{ objects.length }}
          </CommonBadge>
        </div>
      </template>
      <template #actions>
        <div class="flex gap-x-0.5 items-center">
          <ViewerVisibilityButton
            :is-hidden="isHidden"
            :force-visible="showSubMenu"
            @click="hideOrShowSelection"
          />
          <ViewerIsolateButton
            :is-isolated="isIsolated"
            :force-visible="showSubMenu"
            @click="isolateOrUnisolateSelection"
          />
          <LayoutMenu
            v-model:open="showSubMenu"
            :menu-id="menuId"
            :items="actionsItems"
            :custom-menu-items-classes="['!w-42']"
            @click.stop.prevent
            @chosen="onActionChosen"
          >
            <FormButton
              hide-text
              color="subtle"
              size="sm"
              :icon-left="Ellipsis"
              :class="{
                '!bg-highlight-3': showSubMenu
              }"
              @click="showSubMenu = !showSubMenu"
            />
          </LayoutMenu>
        </div>
      </template>

      <div class="space-y-1">
        <ViewerSelectionObject
          v-for="(object, index) in objectsLimited"
          :key="(object.id as string)"
          :object="object"
          :root="true"
          :unfold="index === 0 && !isSmallerOrEqualSm"
        />
      </div>
      <div v-if="itemCount <= objects.length" class="mb-2">
        <FormButton size="sm" text full-width @click="itemCount += 10">
          View more ({{ objects.length - itemCount }})
        </FormButton>
      </div>

      <template #footer>
        <p class="text-foreground-2 text-body-3xs">
          Hold "shift" to select multiple objects
        </p>
      </template>
    </ViewerSidebar>
  </ViewerCommentsPortalOrDiv>
</template>
<script setup lang="ts">
import { onKeyStroke, useBreakpoints } from '@vueuse/core'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { getTargetObjectIds } from '~~/lib/object-sidebar/helpers'
import { containsAll } from '~~/lib/common/helpers/utils'
import { useSelectionUtilities } from '~~/lib/viewer/composables/ui'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import { uniqWith } from 'lodash-es'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useIsSmallerOrEqualThanBreakpoint } from '~~/composables/browser'
import { modelRoute } from '~/lib/common/helpers/route'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { Ellipsis } from 'lucide-vue-next'

enum ActionTypes {
  OpenInNewTab = 'open-in-new-tab'
}

const {
  projectId,
  viewer: {
    metadata: { filteringState }
  },
  ui: { diff, measurement, threads, filters },
  urlHashState: { focusedThreadId }
} = useInjectedViewerState()
const { objects, clearSelection } = useSelectionUtilities()
const { hideObjects, showObjects, isolateObjects, unIsolateObjects } =
  useFilterUtilities()

const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()
const breakpoints = useBreakpoints(TailwindBreakpoints)
const isGreaterThanSm = breakpoints.greater('sm')
const menuId = useId()
const mp = useMixpanel()

const itemCount = ref(20)
const sidebarOpen = ref(false)
const sidebarWidth = ref(280)
const showSubMenu = ref(false)

const objectsUniqueByAppId = computed(() => {
  if (!diff.enabled.value) return objects.value
  return uniqWith(objects.value, (a, b) => {
    return a.applicationId === b.applicationId
  })
})

const shouldRenderSidebar = computed(() => {
  return (!isSmallerOrEqualSm.value || sidebarOpen.value) && !measurement.enabled.value
})

const objectsLimited = computed(() => {
  return objectsUniqueByAppId.value.slice(0, itemCount.value)
})

const hiddenObjects = computed(() => filteringState.value?.hiddenObjects)
// Use singleton isolatedObjectsSet from viewer state
const { isolatedObjectsSet } = filters

const allTargetIds = computed(() => {
  const ids = []
  for (const obj of objects.value) {
    ids.push(...getTargetObjectIds(obj))
  }

  return ids
})

const isHidden = computed(() => {
  if (!hiddenObjects.value) return false
  return containsAll(allTargetIds.value, hiddenObjects.value)
})

const isIsolated = computed(() => {
  if (!isolatedObjectsSet.value) return false
  const isolatedObjectsArray = Array.from(isolatedObjectsSet.value)
  return containsAll(allTargetIds.value, isolatedObjectsArray)
})

const actionsItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title:
        allTargetIds.value.length > 1
          ? 'Open objects in new tab'
          : 'Open object in new tab',
      id: ActionTypes.OpenInNewTab
    }
  ]
])

const selectionLink = computed(() => {
  return modelRoute(projectId.value, allTargetIds.value.join(','))
})

const onActionChosen = (params: { item: LayoutMenuItem; event: MouseEvent }) => {
  const { item } = params

  switch (item.id) {
    case ActionTypes.OpenInNewTab:
      window.open(selectionLink.value, '_blank')
      break
  }
}

const hideOrShowSelection = () => {
  if (!isHidden.value) {
    hideObjects(allTargetIds.value)
    mp.track('Viewer Action', {
      type: 'action',
      name: 'selection',
      action: 'hide'
    })
    return
  }

  showObjects(allTargetIds.value)
  mp.track('Viewer Action', {
    type: 'action',
    name: 'selection',
    action: 'show'
  })
}

const isolateOrUnisolateSelection = () => {
  if (isIsolated.value) {
    unIsolateObjects(allTargetIds.value)
    mp.track('Viewer Action', {
      type: 'action',
      name: 'selection',
      action: 'unisolate'
    })
  } else {
    isolateObjects(allTargetIds.value)
    mp.track('Viewer Action', {
      type: 'action',
      name: 'selection',
      action: 'isolate'
    })
  }
}

const trackAndClearSelection = () => {
  clearSelection()
  mp.track('Viewer Action', {
    type: 'action',
    name: 'selection',
    action: 'clear',
    source: 'sidebar-x-button'
  })
}

const onClose = () => {
  sidebarOpen.value = false
  trackAndClearSelection()
}

const forceClose = () => {
  sidebarOpen.value = false
}

onKeyStroke('Escape', () => {
  // Cleareance of any vis/iso state coming from here should happen in clearSelection()
  // Note: we're not using the trackAndClearSelection method beacuse
  // we want to track whether people press buttons or keys
  clearSelection()
  mp.track('Viewer Action', {
    type: 'action',
    name: 'selection',
    action: 'clear',
    source: 'keypress-escape'
  })
})

watch(
  [
    () => objects.value.length,
    () => focusedThreadId.value,
    () => threads.openThread.newThreadEditor.value,
    () => isSmallerOrEqualSm.value
  ],
  ([objLen, threadId, isNewThreadEditorOpen, isSmSm]) => {
    // Close sidebar if a thread is focused
    if (threadId) {
      sidebarOpen.value = false
      return
    }

    // Close sidebar if new thread editor is open and screen is small
    if (isNewThreadEditorOpen && isSmSm) {
      sidebarOpen.value = false
      return
    }

    // Open sidebar if objects are selected and no thread is focused
    if (objLen !== 0 && !threadId) {
      sidebarOpen.value = true
    } else if (objLen === 0) {
      sidebarOpen.value = false
    }
  }
)

defineExpose({
  forceClose
})
</script>
