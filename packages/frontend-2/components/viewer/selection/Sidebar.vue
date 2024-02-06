<template>
  <ViewerCommentsPortalOrDiv v-if="shouldRenderSidebar" to="bottomPanel">
    <ViewerSidebar :open="sidebarOpen" @close="onClose">
      <template #title><div class="select-none">Selection Info</div></template>
      <template #actions>
        <FormButton
          size="xs"
          color="secondary"
          class="opacity-80 hover:opacity-100"
          @click.stop="hideOrShowSelection"
        >
          <div class="flex items-center gap-1">
            <EyeIcon v-if="!isHidden" class="h-4 w-4" />
            <EyeSlashIcon v-else class="h-4 w-4" />
            Hide
          </div>
        </FormButton>
        <FormButton
          size="xs"
          color="secondary"
          class="hover:opacity-100"
          :class="isIsolated ? 'text-primary opacity-100' : 'opacity-80'"
          @click.stop="isolateOrUnisolateSelection"
        >
          <div class="flex items-center gap-1">
            <FunnelIconOutline v-if="!isIsolated" class="h-4 w-4" />
            <FunnelIcon v-else class="h-4 w-4" />
            Isolate
          </div>
        </FormButton>
      </template>
      <div class="p-1 mb-2 sm:mb-0 sm:py-2">
        <div class="space-y-2">
          <ViewerSelectionObject
            v-for="object in objectsLimited"
            :key="(object.id as string)"
            :object="object"
            :unfold="shouldUnfold"
            :root="true"
          />
        </div>
        <div v-if="itemCount <= objects.length" class="mb-2">
          <FormButton size="xs" text full-width @click="itemCount += 10">
            View More ({{ objects.length - itemCount }})
          </FormButton>
        </div>
      </div>
      <template v-if="!isSmallerOrEqualSm" #footer>
        <div class="text-foreground-2 text-xs select-none">
          Hold "shift" to select multiple objects
        </div>
      </template>
    </ViewerSidebar>
  </ViewerCommentsPortalOrDiv>
</template>
<script setup lang="ts">
import { EyeIcon, EyeSlashIcon, FunnelIcon } from '@heroicons/vue/24/solid'
import { FunnelIcon as FunnelIconOutline } from '@heroicons/vue/24/outline'

import { onKeyStroke } from '@vueuse/core'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { getTargetObjectIds } from '~~/lib/object-sidebar/helpers'
import { containsAll } from '~~/lib/common/helpers/utils'
import { useFilterUtilities, useSelectionUtilities } from '~~/lib/viewer/composables/ui'
import { uniqWith } from 'lodash-es'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useIsSmallerOrEqualThanBreakpoint } from '~~/composables/browser'

const {
  viewer: {
    metadata: { filteringState }
  },
  ui: { diff }
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
  return !isSmallerOrEqualSm.value || sidebarOpen.value
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

const shouldUnfold = computed(() => objectsLimited.value.length === 1)

const mp = useMixpanel()

const hideOrShowSelection = () => {
  if (!isHidden.value) {
    hideObjects(allTargetIds.value)
    clearSelection() // when hiding, the objects disappear. they can't really stay "selected"
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
    if (newLength !== 0) {
      sidebarOpen.value = true
    } else {
      sidebarOpen.value = false
    }
  }
)
</script>
