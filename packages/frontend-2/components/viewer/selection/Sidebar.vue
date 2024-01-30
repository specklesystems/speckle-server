<template>
  <ViewerCommentsPortalOrDiv v-if="objects.length !== 0" to="bottomPanel">
    <div
      :class="`sm:bg-foundation simple-scrollbar z-10 relative sm:fixed sm:right-4 sm:right-4 sm:mb-4 sm:max-w-64 min-h-[3rem] sm:min-h-[4.75rem] max-h-[50vh] sm:max-h-[calc(100vh-5.5rem)] w-full sm:w-64 overflow-y-auto sm:rounded-md sm:shadow transition ${
        objects.length !== 0
          ? 'translate-x-0 opacity-100'
          : 'translate-x-[120%] opacity-0'
      } ${isEmbedEnabled ? 'sm:top-2' : 'sm:top-[4rem]'} ${
        focusedThreadId && isSmallerOrEqualSm ? 'hidden' : ''
      }`"
    >
      <ViewerLayoutPanel @close="trackAndClearSelection()">
        <template #title>Selection Info</template>
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
        <div class="p-1 mb-2 sm:mb-0 sm:py-2 sm:bg-white/90 dark:sm:bg-neutral-700/90">
          <div class="space-y-2">
            <ViewerSelectionObject
              v-for="object in objectsLimited"
              :key="(object.id as string)"
              :object="object"
              :unfold="false"
              :root="true"
            />
          </div>
          <div v-if="itemCount <= objects.length" class="mb-2">
            <FormButton size="xs" text full-width @click="itemCount += 10">
              View More ({{ objects.length - itemCount }})
            </FormButton>
          </div>
          <div
            v-if="objects.length === 1"
            class="hidden sm:block text-foreground-2 mt-2 px-2 text-xs"
          >
            Hold "shift" to select multiple objects
          </div>
        </div>
      </ViewerLayoutPanel>
    </div>
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
import { useEmbed } from '~/lib/viewer/composables/setup/embed'

const {
  viewer: {
    metadata: { filteringState }
  },
  urlHashState: { focusedThreadId },
  ui: { diff }
} = useInjectedViewerState()
const { objects, clearSelection } = useSelectionUtilities()
const { hideObjects, showObjects, isolateObjects, unIsolateObjects } =
  useFilterUtilities()
const { isEmbedEnabled } = useEmbed()

const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()

const itemCount = ref(42)

const objectsUniqueByAppId = computed(() => {
  if (!diff.enabled.value) return objects.value
  return uniqWith(objects.value, (a, b) => {
    return a.applicationId === b.applicationId
  })
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
</script>
