<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div class="bg-foundation relative">
    <div>
      <!-- Model Header -->
      <div
        class="group flex items-center h-16 select-none cursor-pointer hover:bg-highlight-1 border-b border-outline-3"
        @mouseenter="highlightObject"
        @mouseleave="unhighlightObject"
        @focusin="highlightObject"
        @focusout="unhighlightObject"
        @click="selectObject"
        @dblclick="zoomToModel"
        @keydown.enter="selectObject"
      >
        <ViewerExpansionTriangle
          :is-expanded="isExpanded"
          @click="emit('toggle-expansion')"
        />
        <div
          class="h-12 w-12 rounded-md overflow-hidden border border-outline-3 mr-3 shrink-0"
          :class="{ grayscale: shouldShowDimmed }"
        >
          <NuxtImg
            v-if="loadedVersion?.previewUrl"
            :src="loadedVersion.previewUrl"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="flex flex-col min-w-0">
          <div
            v-tippy="modelName.subheader ? model.name : null"
            class="text-body-2xs font-medium truncate"
          >
            {{ modelName.header }}
          </div>
          <div v-if="isLatest" class="text-body-3xs text-foreground">
            Latest version
          </div>
          <div v-else class="text-body-3xs text-primary truncate">
            Viewing old version
          </div>
          <div class="flex items-center gap-1 text-body-3xs text-foreground-2 min-w-0">
            <div
              v-if="loadedVersion?.sourceApplication"
              class="shrink-0 flex items-center gap-1"
            >
              <span>
                {{ loadedVersion.sourceApplication }}
              </span>
              <span class="shrink-0">·</span>
            </div>
            <span class="truncate">
              {{ createdAtFormatted.relative }}
            </span>
          </div>
        </div>
        <div
          class="flex items-center ml-auto mr-2 w-0 group-hover:w-auto"
          :class="showActionsMenu ? '!w-auto' : ''"
        >
          <LayoutMenu
            v-model:open="showActionsMenu"
            :items="actionsItems"
            mount-menu-on-body
            @click.stop.prevent
            @chosen="onActionChosen"
          >
            <button
              class="group-hover:opacity-100 hover:bg-highlight-3 rounded-md h-6 w-6 flex items-center justify-center"
              :class="{
                'opacity-100 bg-highlight-3': showActionsMenu,
                'sm:opacity-0': !showActionsMenu
              }"
              @click.stop="showActionsMenu = !showActionsMenu"
            >
              <IconThreeDots class="w-4 h-4" />
            </button>
          </LayoutMenu>
          <ViewerVisibilityButton
            :is-hidden="isHidden"
            :force-visible="showActionsMenu"
            @click="hideOrShowObject"
          />
          <ViewerIsolateButton
            :is-isolated="isIsolated"
            :force-visible="showActionsMenu"
            @click="isolateOrUnisolateObject"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import type { ViewerLoadedResourcesQuery } from '~~/lib/common/generated/gql/graphql'
import type { Get } from 'type-fest'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import {
  useHighlightedObjectsUtilities,
  useFilterUtilities,
  useCameraUtilities
} from '~~/lib/viewer/composables/ui'
import {
  useInjectedViewerState,
  useInjectedViewerRequestedResources,
  useInjectedViewerLoadedResources
} from '~~/lib/viewer/composables/setup'
import { containsAll } from '~~/lib/common/helpers/utils'
import { getTargetObjectIds } from '~~/lib/object-sidebar/helpers'
import { useLoadLatestVersion } from '~~/lib/viewer/composables/resources'
import { SpeckleViewer } from '@speckle/shared'
import { useMixpanel } from '~~/lib/core/composables/mp'

type ModelItem = NonNullable<Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>>

const emit = defineEmits<{
  (e: 'show-versions', modelId: string): void
  (e: 'show-diff', modelId: string, versionA: string, versionB: string): void
  (e: 'toggle-expansion'): void
}>()

const props = defineProps<{
  model: ModelItem
  versionId: string
  isExpanded?: boolean
}>()

const { highlightObjects, unhighlightObjects } = useHighlightedObjectsUtilities()
const { hideObjects, showObjects, isolateObjects, unIsolateObjects } =
  useFilterUtilities()
const { zoom } = useCameraUtilities()
const { items } = useInjectedViewerRequestedResources()
const { resourceItems } = useInjectedViewerLoadedResources()
const {
  viewer: {
    metadata: { filteringState }
  }
} = useInjectedViewerState()
const mp = useMixpanel()

const route = useRoute()
const resourceIdString = computed(() => {
  const resourceParam = route.params.modelId
  return Array.isArray(resourceParam) ? resourceParam.join('/') : resourceParam
})

const {
  resources: {
    response: { project }
  }
} = useInjectedViewerState()

const { load: loadLatestVersion } = useLoadLatestVersion({
  project: computed(() => project.value),
  resourceIdString: computed(() => resourceIdString.value || '')
})

const showActionsMenu = ref(false)

const removeEnabled = computed(() => items.value.length > 1)
const actionsItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title: 'Load latest version',
      id: 'load-latest-version',
      disabled: isLatest.value,
      disabledTooltip: 'Already on the latest version'
    },
    {
      title: 'Show version history',
      id: 'show-version-history'
    },
    {
      title: 'Show version changes',
      id: 'show-version-changes',
      disabled: isLatest.value,
      disabledTooltip: 'No changes to show for the latest version'
    }
  ],
  [
    {
      title: 'Remove model',
      id: 'remove-model',
      disabled: !removeEnabled.value,
      disabledTooltip: 'You cannot remove the last model'
    }
  ]
])

const versions = computed(() => [
  ...props.model.loadedVersion.items,
  ...props.model.versions.items
])

const loadedVersion = computed(() =>
  versions.value.find((v) => v.id === props.versionId)
)

const createdAt = computed(() => loadedVersion.value?.createdAt)
const createdAtFormatted = computed(() => {
  return {
    full: formattedFullDate(createdAt.value),
    relative: formattedRelativeDate(createdAt.value, { capitalize: true })
  }
})

const latestVersion = computed(() => {
  return versions.value
    .slice()
    .sort((a, b) => (dayjs(a.createdAt).isBefore(dayjs(b.createdAt)) ? 1 : -1))[0]
})

const isLatest = computed(() => loadedVersion.value?.id === latestVersion.value.id)

const modelName = computed(() => {
  const parts = props.model.name.split('/')
  if (parts.length > 1) {
    const name = parts[parts.length - 1]
    parts.pop()
    return {
      subheader: parts.join('/'),
      header: name
    }
  } else {
    return {
      subheader: null,
      header: props.model.name
    }
  }
})

const modelObjectIds = computed(() => {
  const refObject = props.model.loadedVersion.items[0]?.referencedObject
  return refObject ? getTargetObjectIds({ id: refObject }) : []
})

const hiddenObjects = computed(() => filteringState.value?.hiddenObjects)
const isolatedObjects = computed(() => filteringState.value?.isolatedObjects)

const isHidden = computed(() => {
  if (!hiddenObjects.value || modelObjectIds.value.length === 0) return false
  return containsAll(modelObjectIds.value, hiddenObjects.value)
})

const isIsolated = computed(() => {
  if (!isolatedObjects.value || modelObjectIds.value.length === 0) return false
  return containsAll(modelObjectIds.value, isolatedObjects.value)
})

const stateHasIsolatedObjectsInGeneral = computed(() => {
  if (!isolatedObjects.value) return false
  return isolatedObjects.value.length > 0
})

const modelContainsIsolatedObjects = computed(() => {
  if (!isolatedObjects.value || isolatedObjects.value.length === 0) return false

  return isolatedObjects.value.some((isolatedId) =>
    modelObjectIds.value.includes(isolatedId)
  )
})

const shouldShowDimmed = computed(() => {
  return stateHasIsolatedObjectsInGeneral.value && !modelContainsIsolatedObjects.value
})

const hideOrShowObject = (e: Event) => {
  e.stopPropagation()
  if (modelObjectIds.value.length === 0) return

  if (!isHidden.value) {
    hideObjects(modelObjectIds.value)
  } else {
    showObjects(modelObjectIds.value)
  }
}

const isolateOrUnisolateObject = (e: Event) => {
  e.stopPropagation()
  if (modelObjectIds.value.length === 0) return

  if (!isIsolated.value) {
    isolateObjects(modelObjectIds.value)
  } else {
    unIsolateObjects(modelObjectIds.value)
  }
}

const highlightObject = () => {
  const refObject = props.model.loadedVersion.items[0]?.referencedObject
  if (refObject) highlightObjects([refObject])
}

const unhighlightObject = () => {
  const refObject = props.model.loadedVersion.items[0]?.referencedObject
  if (refObject) unhighlightObjects([refObject])
}

const selectObject = () => {
  // Only expand if not already expanded
  if (!props.isExpanded) {
    emit('toggle-expansion')
  }
}

const zoomToModel = () => {
  if (modelObjectIds.value.length > 0) {
    zoom(modelObjectIds.value)
  }
}

const removeModel = async (modelId: string) => {
  const builder = SpeckleViewer.ViewerRoute.resourceBuilder()
  for (const loadedResource of resourceItems.value) {
    if (loadedResource.modelId) {
      if (loadedResource.modelId !== modelId) {
        builder.addModel(loadedResource.modelId, loadedResource.versionId || undefined)
      }
    } else {
      if (loadedResource.objectId !== modelId)
        builder.addObject(loadedResource.objectId)
    }
  }
  mp.track('Viewer Action', { type: 'action', name: 'federation', action: 'remove' })
  await items.update(builder.toResources())
}

const onActionChosen = async (params: { item: LayoutMenuItem }) => {
  const { item } = params

  switch (item.id) {
    case 'load-latest-version':
      if (!isLatest.value) {
        loadLatestVersion()
      }
      break
    case 'show-version-history':
      emit('show-versions', props.model.id)
      break
    case 'show-version-changes':
      if (
        loadedVersion.value &&
        latestVersion.value &&
        loadedVersion.value.id !== latestVersion.value.id
      ) {
        emit(
          'show-diff',
          props.model.id,
          loadedVersion.value.id,
          latestVersion.value.id
        )
      }
      break
    case 'remove-model':
      if (removeEnabled.value) {
        await removeModel(props.model.id)
      }
      break
  }
}
</script>
