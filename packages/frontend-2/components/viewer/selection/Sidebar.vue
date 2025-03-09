<template>
  <ViewerCommentsPortalOrDiv v-if="shouldRenderSidebar" to="bottomPanel">
    <ViewerSidebar :open="sidebarOpen" @close="onClose">
      <template #title>Selection info</template>
      <template #actions>
        <div class="flex flex-col divide-y divide-outline-3">
          <div class="flex py-1.5 pl-3 pr-1.5 gap-x-2 items-center">
            <FormButton
              size="sm"
              color="outline"
              :icon-left="isHidden ? EyeSlashIcon : EyeIcon"
              @click.stop="hideOrShowSelection"
            >
              {{ isHidden ? 'Hidden' : 'Hide' }}
            </FormButton>
            <FormButton
              size="sm"
              color="outline"
              :icon-left="isIsolated ? FunnelIcon : FunnelIconOutline"
              @click.stop="isolateOrUnisolateSelection"
            >
              {{ isIsolated ? 'Isolated' : 'Isolate' }}
            </FormButton>
            <div class="flex justify-end w-full">
              <div v-tippy="`Open selection in new window`" class="max-w-max">
                <FormButton
                  size="sm"
                  color="subtle"
                  :to="selectionLink"
                  target="_blank"
                >
                  <span class="sr-only">Open selection in new window</span>
                  <ArrowTopRightOnSquareIcon class="w-4" />
                </FormButton>
              </div>
            </div>
          </div>
          <div class="text-foreground-2 text-body-3xs py-1.5 px-3">
            Hold "shift" to select multiple objects
          </div>
        </div>
      </template>
      <div class="p-1 mb-2 sm:mb-0 sm:py-2">
        <div class="space-y-2">
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
      </div>
    </ViewerSidebar>
  </ViewerCommentsPortalOrDiv>
  <div v-else />
</template>
<script setup lang="ts">
import {
  EyeSlashIcon,
  EyeIcon,
  FunnelIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/vue/24/solid'
import { FunnelIcon as FunnelIconOutline } from '@heroicons/vue/24/outline'

import { onKeyStroke } from '@vueuse/core'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { getTargetObjectIds } from '~~/lib/object-sidebar/helpers'
import { containsAll } from '~~/lib/common/helpers/utils'
import { useFilterUtilities, useSelectionUtilities } from '~~/lib/viewer/composables/ui'
import { uniqWith } from 'lodash-es'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useIsSmallerOrEqualThanBreakpoint } from '~~/composables/browser'
import { modelRoute } from '~/lib/common/helpers/route'

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

const itemCount = ref(20)
const sidebarOpen = ref(false)

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

const mp = useMixpanel()

const selectionLink = computed(() => {
  return modelRoute(projectId.value, allTargetIds.value.join(','))
})

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
