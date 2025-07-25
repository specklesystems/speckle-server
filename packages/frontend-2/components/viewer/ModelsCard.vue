<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div class="relative border-b border-outline-3">
    <div
      @mouseenter="highlightObject"
      @mouseleave="unhighlightObject"
      @focusin="highlightObject"
      @focusout="unhighlightObject"
    >
      <!-- Model Header -->
      <div
        class="group flex items-center px-1 py-3 select-none cursor-pointer hover:bg-highlight-1"
        :class="isExpanded && !showRemove ? 'border-b border-outline-3' : ''"
      >
        <FormButton size="sm" color="subtle" @click.stop="isExpanded = !isExpanded">
          <IconTriangle
            class="w-4 h-4 -ml-1.5 -mr-1.5 text-foreground-2"
            :class="isExpanded ? 'rotate-90' : ''"
          />
          <span class="sr-only">
            {{ isExpanded ? 'Collapse' : 'Expand' }}
          </span>
        </FormButton>
        <div class="h-12 w-12 rounded-md overflow-hidden border border-outline-3 mr-3">
          <NuxtImg
            :src="loadedVersion?.previewUrl"
            class="object-cover h-full w-full"
          />
        </div>
        <div class="flex flex-col">
          <div
            v-tippy="modelName.subheader ? model.name : null"
            class="text-body-2xs font-medium"
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
        <div class="flex items-center gap-2 ml-auto">
          <div class="flex">
            <FormButton
              size="sm"
              color="subtle"
              class="group-hover:opacity-100"
              :class="{
                'opacity-100': isHidden,
                'opacity-0': !isHidden
              }"
              @click="hideOrShowObject"
            >
              <EyeIcon v-if="!isHidden" class="h-3 w-3 text-foreground -ml-1 -mr-1" />
              <EyeSlashIcon v-else class="h-3 w-3 text-foreground -ml-1 -mr-1" />
              <span class="sr-only">
                {{ isHidden ? 'Show' : 'Hide' }}
              </span>
            </FormButton>
            <FormButton
              size="sm"
              color="subtle"
              :class="{
                'opacity-100': isIsolated,
                'opacity-0': !isIsolated
              }"
              class="group-hover:opacity-100"
              @click="isolateOrUnisolateObject"
            >
              <FunnelIconOutline
                v-if="!isIsolated"
                class="h-3 w-3 text-foreground -ml-1 -mr-1"
              />
              <FunnelIcon v-else class="h-3 w-3 text-foreground -ml-1 -mr-1" />
              <span class="sr-only">
                {{ isIsolated ? 'Unisolate' : 'Isolate' }}
              </span>
            </FormButton>
          </div>
        </div>
      </div>

      <!-- Scene Explorer Content -->
      <div
        v-if="isExpanded && rootNodeChildren.length && !showRemove"
        class="relative flex flex-col gap-y-2"
      >
        <div v-for="(childNode, idx) in rootNodeChildren" :key="idx" class="rounded-xl">
          <ViewerExplorerTreeItem
            :tree-item="{ rawNode: markRaw(childNode) }"
            :sub-header="'Model content'"
            :expand-level="expandLevel"
            :manual-expand-level="manualExpandLevel"
            @expanded="(e: number) => $emit('expanded', e)"
          />
        </div>
      </div>
    </div>

    <!-- Remove Overlay -->
    <div
      v-if="showRemove"
      class="absolute top-0 right-2 h-full z-10 flex items-center justify-end"
    >
      <FormButton
        color="danger"
        size="sm"
        hide-text
        :icon-left="XMarkIcon"
        @click="$emit('remove', props.model.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { XMarkIcon, EyeIcon, EyeSlashIcon, FunnelIcon } from '@heroicons/vue/24/solid'
import { FunnelIcon as FunnelIconOutline } from '@heroicons/vue/24/outline'
import type { ViewerLoadedResourcesQuery } from '~~/lib/common/generated/gql/graphql'
import type { Get } from 'type-fest'
import type { ExplorerNode } from '~~/lib/viewer/helpers/sceneExplorer'
import {
  useHighlightedObjectsUtilities,
  useFilterUtilities
} from '~~/lib/viewer/composables/ui'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { containsAll } from '~~/lib/common/helpers/utils'

type ModelItem = NonNullable<Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>>

defineEmits<{
  (e: 'remove', val: string): void
  (e: 'expanded', depth: number): void
}>()

const props = defineProps<{
  model: ModelItem
  versionId: string
  showRemove: boolean
  last: boolean
  expandLevel: number
  manualExpandLevel: number
  rootNodes: ExplorerNode[]
}>()

const { highlightObjects, unhighlightObjects } = useHighlightedObjectsUtilities()
const { hideObjects, showObjects, isolateObjects, unIsolateObjects } =
  useFilterUtilities()
const {
  viewer: {
    metadata: { filteringState }
  }
} = useInjectedViewerState()

const isExpanded = ref(false)

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
</script>
