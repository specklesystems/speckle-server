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
          <p>Selected</p>
          <CommonBadge v-if="objects.length" rounded>
            {{ objects.length }}
          </CommonBadge>
        </div>
      </template>
      <template #actions>
        <div class="flex gap-x-0.5 items-center">
          <div
            v-tippy="getTooltipProps(isHidden ? 'Show' : 'Hide', { placement: 'top' })"
          >
            <FormButton
              color="subtle"
              :icon-left="isHidden ? iconEyeClosed : iconEye"
              hide-text
              @click.stop="hideOrShowSelection"
            />
          </div>
          <div
            v-tippy="
              getTooltipProps(isIsolated ? 'Unisolate' : 'Isolate', {
                placement: 'top'
              })
            "
          >
            <FormButton
              color="subtle"
              :icon-left="isIsolated ? iconViewerUnisolate : iconViewerIsolate"
              hide-text
              @click.stop="isolateOrUnisolateSelection"
            />
          </div>
          <LayoutMenu
            v-model:open="showSubMenu"
            :menu-id="menuId"
            :items="actionsItems"
            :custom-menu-items-classes="['!w-48']"
            @click.stop.prevent
            @chosen="onActionChosen"
          >
            <FormButton
              hide-text
              color="subtle"
              :icon-left="settingsIcon"
              @click="showSubMenu = !showSubMenu"
            />
          </LayoutMenu>
        </div>
      </template>

      <div class="space-y-1">
        <ViewerSelectionObject
          v-for="object in objectsLimited"
          :key="(object.id as string)"
          :object="object"
          :root="true"
          :unfold="objectsLimited.length === 1 && !isSmallerOrEqualSm"
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
import { useFilterUtilities, useSelectionUtilities } from '~~/lib/viewer/composables/ui'
import { uniqWith } from 'lodash-es'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useIsSmallerOrEqualThanBreakpoint } from '~~/composables/browser'
import { modelRoute } from '~/lib/common/helpers/route'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import type { ConcreteComponent } from 'vue'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'

enum ActionTypes {
  OpenInNewTab = 'open-in-new-tab'
}

const {
  projectId,
  viewer: {
    metadata: { filteringState }
  },
  ui: { diff, measurement, threads },
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
const { getTooltipProps } = useSmartTooltipDelay()

const itemCount = ref(20)
const sidebarOpen = ref(false)
const sidebarWidth = ref(280)
const showSubMenu = ref(false)
const iconViewerUnisolate = resolveComponent('IconViewerUnisolate') as ConcreteComponent
const iconViewerIsolate = resolveComponent('IconViewerIsolate') as ConcreteComponent
const iconEyeClosed = resolveComponent('IconEyeClosed') as ConcreteComponent
const iconEye = resolveComponent('IconEye') as ConcreteComponent
const settingsIcon = resolveComponent('IconThreeDots') as ConcreteComponent

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
const isolatedObjects = computed(() => filteringState.value?.isolatedObjects)

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
  if (!isolatedObjects.value) return false
  return containsAll(allTargetIds.value, isolatedObjects.value)
})

const actionsItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title: 'Open selection in new tab',
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
  () => objects.value.length,
  (newLength) => {
    // Dont open sidebar if a comment is open
    if (newLength !== 0 && !focusedThreadId.value) {
      sidebarOpen.value = true
    } else if (newLength === 0) {
      sidebarOpen.value = false
    }
  }
)

// Close sidebar when a new thread is being added and screen is smaller than md breakpoint
watch(
  () => threads.openThread.newThreadEditor.value,
  (isNewThreadEditorOpen) => {
    if (isNewThreadEditorOpen && isSmallerOrEqualSm.value) {
      sidebarOpen.value = false
    }
  }
)

watch(
  () => focusedThreadId.value,
  (newThreadId) => {
    if (newThreadId) {
      // If a thread is focused, close the sidebar
      sidebarOpen.value = false
    } else if (objects.value.length > 0) {
      // If no thread is focused and we have objects selected, open the sidebar
      sidebarOpen.value = true
    }
  }
)
</script>
