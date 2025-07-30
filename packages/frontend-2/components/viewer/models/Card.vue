<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div class="relative border-b border-outline-3">
    <div
      @mouseenter="highlightObject"
      @mouseleave="unhighlightObject"
      @focusin="highlightObject"
      @focusout="unhighlightObject"
      @click="selectObject"
      @keydown.enter="selectObject"
    >
      <!-- Model Header -->
      <div
        class="group flex items-center px-1 py-3 select-none cursor-pointer hover:bg-highlight-1"
      >
        <button
          class="group-hover:opacity-100 hover:bg-highlight-3 rounded-md h-5 w-4 flex items-center justify-center shrink-0"
          @click.stop="isExpanded = !isExpanded"
        >
          <IconTriangle
            class="w-4 h-4 text-foreground-2"
            :class="isExpanded ? 'rotate-90' : ''"
          />
          <span class="sr-only">
            {{ isExpanded ? 'Collapse' : 'Expand' }}
          </span>
        </button>
        <div
          class="h-12 w-12 rounded-md overflow-hidden border border-outline-3 mr-3 shrink-0"
          :class="{ grayscale: shouldShowDimmed }"
        >
          <PreviewImage
            v-if="loadedVersion?.previewUrl"
            :preview-url="loadedVersion.previewUrl"
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
          <div class="text-body-3xs text-foreground-2">
            {{ createdAtFormatted.relative }}
          </div>
        </div>
        <div class="flex items-center ml-auto">
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
                'opacity-100': showActionsMenu,
                'opacity-0': !showActionsMenu
              }"
              @click.stop="showActionsMenu = !showActionsMenu"
            >
              <IconThreeDots class="w-4 h-4" />
            </button>
          </LayoutMenu>
          <button
            v-tippy="
              getTooltipProps(isHidden ? 'Show' : 'Hide', {
                placement: 'top'
              })
            "
            class="group-hover:opacity-100 hover:bg-highlight-3 rounded-md h-6 w-6 flex items-center justify-center"
            :class="{
              'opacity-100': isHidden,
              'opacity-0': !isHidden
            }"
            @click.stop="hideOrShowObject"
          >
            <IconEyeClosed v-if="isHidden" class="w-4 h-4" />
            <IconEye v-else class="w-4 h-4" />
          </button>
          <button
            v-tippy="
              getTooltipProps(isIsolated ? 'Unisolate' : 'Isolate', {
                placement: 'top'
              })
            "
            class="group-hover:opacity-100 hover:bg-highlight-3 rounded-md h-6 w-6 flex items-center justify-center"
            :class="{
              'opacity-100': isIsolated,
              'opacity-0': !isIsolated
            }"
            @click.stop="isolateOrUnisolateObject"
          >
            <IconViewerUnisolate v-if="isIsolated" class="w-3.5 h-3.5" />
            <IconViewerIsolate v-else class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Scene Explorer Content -->
      <div
        v-if="isExpanded && rootNodeChildren.length"
        class="relative flex flex-col gap-y-2"
      >
        <div v-for="(childNode, idx) in rootNodeChildren" :key="idx">
          <ViewerModelsTreeItem
            :tree-item="{ rawNode: markRaw(childNode) }"
            :sub-header="'Model content'"
            :expand-level="expandLevel"
            :manual-expand-level="manualExpandLevel"
            :is-descendant-of-selected="false"
            @expanded="(e: number) => $emit('expanded', e)"
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
import type { ExplorerNode } from '~~/lib/viewer/helpers/sceneExplorer'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import {
  useHighlightedObjectsUtilities,
  useFilterUtilities,
  useSelectionUtilities
} from '~~/lib/viewer/composables/ui'
import {
  useInjectedViewerState,
  useInjectedViewerRequestedResources
} from '~~/lib/viewer/composables/setup'
import { containsAll } from '~~/lib/common/helpers/utils'

type ModelItem = NonNullable<Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>>

const emit = defineEmits<{
  (e: 'remove', val: string): void
  (e: 'expanded', depth: number): void
}>()

const props = defineProps<{
  model: ModelItem
  versionId: string
  last: boolean
  expandLevel: number
  manualExpandLevel: number
  rootNodes: ExplorerNode[]
}>()

const { getTooltipProps } = useSmartTooltipDelay()

const { highlightObjects, unhighlightObjects } = useHighlightedObjectsUtilities()
const { hideObjects, showObjects, isolateObjects, unIsolateObjects } =
  useFilterUtilities()
const { setSelectionFromObjectIds } = useSelectionUtilities()
const { items } = useInjectedViewerRequestedResources()
const {
  viewer: {
    metadata: { filteringState }
  }
} = useInjectedViewerState()

const isExpanded = ref(false)
const showActionsMenu = ref(false)

const IconEye = resolveComponent('IconEye')
const IconEyeClosed = resolveComponent('IconEyeClosed')

const removeEnabled = computed(() => items.value.length > 1)

const actionsItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title: 'Remove model',
      id: 'remove-model',
      disabled: !removeEnabled.value,
      disabledTooltip: 'You cannot remove the last model'
    }
  ]
])

const rootNodeChildren = computed(() => {
  const children: ExplorerNode[] = []
  for (const rootNode of props.rootNodes) {
    if (rootNode.children && rootNode.children.length > 0) {
      children.push(...rootNode.children)
    }
  }
  return children
})

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

// Get target object IDs for the model
const modelObjectIds = computed(() => {
  const refObject = props.model.loadedVersion.items[0]?.referencedObject
  return refObject ? [refObject] : []
})

// State for hide/show and isolate
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

  // Check if any isolated object is a descendant of this model
  const getAllDescendantIds = (nodes: ExplorerNode[]): string[] => {
    const ids: string[] = []
    for (const node of nodes) {
      if (node.raw?.id) {
        ids.push(node.raw.id)
      }
      if (node.children && node.children.length > 0) {
        ids.push(...getAllDescendantIds(node.children))
      }
    }
    return ids
  }

  const allModelObjectIds = [
    ...modelObjectIds.value,
    ...getAllDescendantIds(props.rootNodes)
  ]

  return isolatedObjects.value.some((isolatedId) =>
    allModelObjectIds.includes(isolatedId)
  )
})

const shouldShowDimmed = computed(() => {
  return stateHasIsolatedObjectsInGeneral.value && !modelContainsIsolatedObjects.value
})

// Functions for hide/show and isolate
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
  if (modelObjectIds.value.length === 0) return
  setSelectionFromObjectIds(modelObjectIds.value)

  // Auto-expand when selecting if it has content and is not already expanded
  if (rootNodeChildren.value.length > 0 && !isExpanded.value) {
    isExpanded.value = true
  }
}

const onActionChosen = (params: { item: LayoutMenuItem }) => {
  const { item } = params

  switch (item.id) {
    case 'remove-model':
      if (removeEnabled.value) {
        emit('remove', props.model.id)
      }
      break
  }
}
</script>
