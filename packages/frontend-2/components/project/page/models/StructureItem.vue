<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div class="space-y-4 relative" @mouseleave="showActionsMenu = false">
    <div
      v-if="itemType !== StructureItemType.ModelWithOnlySubmodels"
      class="group relative bg-foundation w-full p-2 flex flex-row rounded-md transition-all border border-outline-3 items-stretch"
    >
      <div class="flex items-center flex-grow order-2 sm:order-1 pl-2 sm:pl-4">
        <!-- Name -->
        <div class="flex gap-2 items-center">
          <NuxtLink :to="modelLink || undefined">
            <span class="text-heading text-foreground hover:text-primary">
              {{ name }}
            </span>
          </NuxtLink>
          <span v-if="model">
            <ProjectPageModelsActions
              v-model:open="showActionsMenu"
              :model="model"
              :project="project"
              :can-edit="canContribute"
              :menu-position="
                itemType === StructureItemType.EmptyModel
                  ? HorizontalDirection.Right
                  : HorizontalDirection.Left
              "
              @click.stop.prevent
              @model-updated="$emit('model-updated')"
              @upload-version="triggerVersionUpload"
            />
          </span>
        </div>
        <!-- Empty model action -->
        <NuxtLink
          v-if="itemType === StructureItemType.EmptyModel"
          :class="[
            'cursor-pointer ml-2 text-xs text-foreground-2 flex items-center space-x-1',
            'opacity-0 group-hover:opacity-100 transition duration-200',
            'hover:text-primary p-1'
          ]"
          @click.stop="$emit('create-submodel', model?.name || '')"
        >
          <PlusIcon class="w-3 h-3" />
          submodel
        </NuxtLink>
        <!-- Spacer -->
        <div class="flex-grow"></div>
        <ProjectCardImportFileArea
          v-if="!isPendingFileUpload(item)"
          ref="importArea"
          :project-id="project.id"
          :model-name="item.fullName"
          class="hidden"
        />
        <div
          v-if="
            !isPendingFileUpload(item) &&
            (pendingVersion || itemType === StructureItemType.EmptyModel)
          "
          class="flex items-center h-full"
        >
          <ProjectPendingFileImportStatus
            v-if="pendingVersion"
            :upload="pendingVersion"
            type="subversion"
            class="px-4 w-full"
          />
          <ProjectCardImportFileArea
            v-else
            :project-id="project.id"
            :model-name="item.fullName"
            class="h-full w-full"
          />
        </div>
        <div v-else-if="hasVersions" class="hidden sm:flex items-center gap-x-2">
          <div class="text-body-3xs text-foreground-2 text-right">
            Updated
            <span v-tippy="updatedAt.full">
              {{ updatedAt.relative }}
            </span>
          </div>
          <div class="space-x-2 flex flex-row pils">
            <div class="text-body-xs text-foreground flex items-center space-x-1 pl-2">
              <IconDiscussions class="w-4 h-4" />
              <span>{{ model?.commentThreadCount.totalCount }}</span>
            </div>
            <div v-if="model?.automationsStatus">
              <AutomateRunsTriggerStatus
                :project-id="project.id"
                :status="model.automationsStatus"
                :model-id="model.id"
              />
            </div>

            <div class="flex gap-2 items-center">
              <FormButton
                v-if="!isPendingFileUpload(item) && model?.id"
                rounded
                size="sm"
                class="gap-0.5"
                color="subtle"
                @click.stop="onVersionsClick"
              >
                <IconVersions class="h-4 w-4" />
                {{ model?.versionCount.totalCount }}
              </FormButton>
            </div>
          </div>
        </div>
        <ProjectPendingFileImportStatus
          v-else-if="pendingModel && itemType === StructureItemType.PendingModel"
          :upload="pendingModel"
          class="text-foreground-2 text-sm flex flex-col items-center space-y-1 mr-4"
        />
      </div>
      <!-- Preview or icon section -->
      <div
        v-if="!isPendingFileUpload(item) && item.model?.previewUrl && !pendingVersion"
        class="w-20 h-16"
      >
        <NuxtLink
          :to="modelLink || ''"
          class="h-full w-full block bg-foundation-page rounded-lg border border-outline-3 hover:border-outline-5"
        >
          <PreviewImage
            v-if="item.model?.previewUrl"
            :preview-url="item.model.previewUrl"
          />
        </NuxtLink>
      </div>
    </div>
    <!-- Doubling up for mixed items -->
    <div
      v-if="hasSubmodels"
      class="border-l-2 border-primary-muted hover:border-primary transition rounded-md"
    >
      <button
        class="group bg-foundation w-full py-1 pr-2 sm:pr-4 flex items-center rounded-md cursor-pointer hover:border-outline-5 transition-all border border-outline-3 border-l-0"
        href="/test"
        @click.stop="expanded = !expanded"
      >
        <!-- Icon -->
        <div>
          <div class="mx-2 flex items-center hover:text-primary text-foreground-2 h-14">
            <ChevronDownIcon
              :class="`w-4 h-4 transition ${expanded ? 'rotate-180' : ''}`"
            />
          </div>
        </div>
        <!-- Name -->
        <FolderIcon class="w-4 h-4 text-foreground" />
        <div class="ml-2 text-heading text-foreground flex-grow text-left">
          {{ name }}
        </div>
        <!-- Preview -->
        <div class="flex flex-col items-end sm:flex-row sm:items-center gap-1 sm:gap-4">
          <!-- Commented out so that we need to load less data, can be added back -->
          <!-- <div
            v-for="(child, index) in item.children"
            :key="index"
            :class="`w-16 h-16 ml-2`"
          >
            <div
              class="w-full h-full rounded-md bg-primary-muted shadow flex items-center justify-center text-blue-500/50 text-xs"
            >
              {{ child?.name }}
            </div>
          </div> -->
          <div class="text-body-2xs text-foreground-2">
            Updated
            <span v-tippy="updatedAt.full">
              {{ updatedAt.relative }}
            </span>
          </div>
          <FormButton
            size="sm"
            color="outline"
            :to="viewAllUrl"
            :disabled="!viewAllUrl"
            @click.stop="trackFederateModels"
          >
            View all
          </FormButton>
        </div>
      </button>
      <!-- Children list -->
      <div
        v-if="hasChildren && expanded && !isPendingFileUpload(item)"
        class="pl-8 mt-2 space-y-2"
      >
        <div v-if="childrenLoading" class="mr-8">
          <CommonLoadingBar loading />
        </div>

        <template v-else>
          <div v-for="child in children" :key="child.fullName" class="flex">
            <div class="h-20 absolute -ml-8 flex items-center mt-0 mr-1 pl-1">
              <ChevronDownIcon class="w-4 h-4 rotate-45 text-foreground-2" />
            </div>

            <ProjectPageModelsStructureItem
              :item="child"
              :project="project"
              :can-contribute="canContribute"
              class="flex-grow"
              @model-updated="onModelUpdated"
              @create-submodel="emit('create-submodel', $event)"
            />
          </div>
        </template>
        <div v-if="canContribute" class="mr-8"></div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { modelVersionsRoute, modelRoute } from '~~/lib/common/helpers/route'
import { ChevronDownIcon, PlusIcon } from '@heroicons/vue/20/solid'
import { FolderIcon } from '@heroicons/vue/24/outline'
import type {
  PendingFileUploadFragment,
  ProjectPageModelsStructureItem_ProjectFragment,
  SingleLevelModelTreeItemFragment
} from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import { projectModelChildrenTreeQuery } from '~~/lib/projects/graphql/queries'
import { has } from 'lodash-es'
import type { Nullable } from '@speckle/shared'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useIsModelExpanded } from '~~/lib/projects/composables/models'
import { HorizontalDirection } from '~~/lib/common/composables/window'

/**
 * TODO: The template in this file is a complete mess, needs refactoring
 */

enum StructureItemType {
  EmptyModel, // emptyModel
  ModelWithOnlyVersions, // fullModel
  ModelWithOnlySubmodels, // group
  ModelWithVersionsAndSubmodels, // mixed
  PendingModel
}

graphql(`
  fragment ProjectPageModelsStructureItem_Project on Project {
    id
    ...ProjectPageModelsActions_Project
  }
`)

graphql(`
  fragment SingleLevelModelTreeItem on ModelsTreeItem {
    id
    name
    fullName
    model {
      ...ProjectPageLatestItemsModelItem
    }
    hasChildren
    updatedAt
  }
`)

const isPendingFileUpload = (
  i: SingleLevelModelTreeItemFragment | PendingFileUploadFragment
): i is PendingFileUploadFragment => has(i, 'uploadDate')

const emit = defineEmits<{
  (e: 'model-updated'): void
  (e: 'create-submodel', parentModelName: string): void
}>()

const props = defineProps<{
  item: SingleLevelModelTreeItemFragment | PendingFileUploadFragment
  project: ProjectPageModelsStructureItem_ProjectFragment
  canContribute?: boolean
  isSearchResult?: boolean
}>()

provide('projectId', props.project.id)

const router = useRouter()

const importArea = ref(
  null as Nullable<{
    triggerPicker: () => void
  }>
)

const mp = useMixpanel()
const trackFederateModels = () =>
  mp.track('Viewer Action', {
    type: 'action',
    name: 'federation',
    action: 'view-all',
    source: 'model grid item'
  })

const showActionsMenu = ref(false)

const itemType = computed<StructureItemType>(() => {
  if (isPendingFileUpload(props.item)) return StructureItemType.PendingModel

  const item = props.item
  if (item.model?.versionCount.totalCount) {
    if (hasChildren.value) {
      return StructureItemType.ModelWithVersionsAndSubmodels
    } else {
      return StructureItemType.ModelWithOnlyVersions
    }
  } else {
    if (hasChildren.value) {
      return StructureItemType.ModelWithOnlySubmodels
    } else {
      return StructureItemType.EmptyModel
    }
  }
})

const hasVersions = computed(() =>
  [
    StructureItemType.ModelWithOnlyVersions,
    StructureItemType.ModelWithVersionsAndSubmodels
  ].includes(itemType.value)
)
const hasSubmodels = computed(() =>
  [
    StructureItemType.ModelWithOnlySubmodels,
    StructureItemType.ModelWithVersionsAndSubmodels
  ].includes(itemType.value)
)

const name = computed(() => {
  if (isPendingFileUpload(props.item)) return props.item.modelName
  return props.isSearchResult ? props.item.fullName : props.item.name
})
const fullName = computed(() =>
  isPendingFileUpload(props.item) ? props.item.modelName : props.item.fullName
)
const expanded = useIsModelExpanded({
  fullName,
  projectId: computed(() => props.project.id)
})

const model = computed(() =>
  !isPendingFileUpload(props.item) ? props.item.model : null
)
const pendingModel = computed(() =>
  isPendingFileUpload(props.item) ? props.item : null
)
const pendingVersion = computed(() => model.value?.pendingImportedVersions[0])
const hasChildren = computed(() =>
  props.isSearchResult || isPendingFileUpload(props.item)
    ? false
    : props.item.hasChildren
)

const updatedAt = computed(() => {
  const date = isPendingFileUpload(props.item)
    ? props.item.convertedLastUpdate || props.item.uploadDate
    : props.item.updatedAt

  return {
    full: formattedFullDate(date),
    relative: formattedRelativeDate(date, { prefix: true })
  }
})

const modelLink = computed(() => {
  if (
    isPendingFileUpload(props.item) ||
    !props.item.model ||
    props.item.model?.versionCount.totalCount === 0
  )
    return null
  return modelRoute(props.project.id, props.item.model.id)
})

const viewAllUrl = computed(() => {
  if (isPendingFileUpload(props.item)) return undefined
  const fullName = props.item.fullName
  const encodedFullName = `$${fullName}`.replace(/\//g, '%2F')
  return modelRoute(props.project.id, encodedFullName)
})

const {
  result: childrenResult,
  refetch: refetchChildren,
  loading: childrenLoading
} = useQuery(
  projectModelChildrenTreeQuery,
  () => ({
    projectId: props.project.id,
    parentName: isPendingFileUpload(props.item) ? '' : props.item.fullName
  }),
  () => ({
    enabled: hasChildren.value && expanded.value && !isPendingFileUpload(props.item)
  })
)

const children = computed(() => childrenResult.value?.project?.modelChildrenTree || [])

const onModelUpdated = () => {
  emit('model-updated')
  refetchChildren()
}

const triggerVersionUpload = () => {
  importArea.value?.triggerPicker()
}

const onVersionsClick = () => {
  if (model.value) {
    router.push(modelVersionsRoute(props.project.id, model.value.id))
  }
}
</script>
