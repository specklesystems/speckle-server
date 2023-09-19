<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div class="space-y-4 relative" @mouseleave="showActionsMenu = false">
    <div
      v-if="itemType !== StructureItemType.ModelWithOnlySubmodels"
      class="group bg-foundation w-full py-1 pr-1 flex rounded-md shadow hover:shadow-xl hover:bg-primary-muted transition-all border-l-2 border-primary-muted hover:border-primary items-stretch"
    >
      <div class="flex items-center flex-grow">
        <!-- Icon -->
        <template v-if="model">
          <CubeIcon
            v-if="model.versionCount.totalCount !== 0"
            class="w-4 h-4 text-foreground-2 mx-2"
          />
          <CubeTransparentIcon v-else class="w-4 h-4 text-foreground-2 mx-2" />
        </template>
        <template v-else-if="pendingModel">
          <ArrowUpOnSquareIcon class="w-4 h-4 text-foreground-2 mx-2" />
        </template>

        <!-- Name -->
        <div class="flex justify-start space-x-2 items-center">
          <NuxtLink :to="modelLink || ''" class="text-lg font-bold text-foreground">
            {{ name }}
          </NuxtLink>
          <span v-if="model" class="opacity-0 group-hover:opacity-100 transition">
            <ProjectPageModelsActions
              v-model:open="showActionsMenu"
              :model="model"
              :project-id="projectId"
              :can-edit="canContribute"
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
          :project-id="projectId"
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
            :project-id="projectId"
            :model-name="item.fullName"
            class="h-full w-full"
          />
        </div>
        <div v-else-if="hasVersions" class="flex items-center space-x-10">
          <div class="text-xs text-foreground-2">
            updated
            <b>{{ updatedAt }}</b>
          </div>
          <div class="text-xs text-foreground-2 flex items-center space-x-1">
            <span>{{ model?.commentThreadCount.totalCount }}</span>
            <ChatBubbleLeftRightIcon class="w-4 h-4" />
          </div>
          <div class="text-xs text-foreground-2">
            <FormButton
              v-if="!isPendingFileUpload(item) && item.model"
              rounded
              size="xs"
              :icon-left="ArrowPathRoundedSquareIcon"
              :to="modelVersionsRoute(projectId, item.model.id)"
            >
              {{ model?.versionCount.totalCount }}
            </FormButton>
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
        class="w-24 h-20 ml-4"
      >
        <NuxtLink :to="modelLink || ''" class="h-full w-full">
          <PreviewImage
            v-if="item.model?.previewUrl"
            :preview-url="item.model.previewUrl"
          />
        </NuxtLink>
      </div>
      <div v-else class="h-20" />
    </div>
    <!-- Doubling up for mixed items -->
    <div
      v-if="hasSubmodels"
      class="border-l-2 border-primary-muted hover:border-primary transition rounded-md"
    >
      <button
        class="group bg-foundation w-full py-1 pr-1 flex items-center rounded-md shadow hover:shadow-xl cursor-pointer hover:bg-primary-muted transition-all"
        href="/test"
        @click.stop="expanded = !expanded"
      >
        <!-- Icon -->
        <div>
          <div class="mx-2 flex items-center hover:text-primary text-foreground-2 h-16">
            <ChevronDownIcon
              :class="`w-4 h-4 transition ${expanded ? 'rotate-180' : ''}`"
            />
          </div>
        </div>
        <!-- Name -->
        <div class="text-lg font-bold text-foreground flex-grow text-left">
          {{ name }}
        </div>
        <!-- Preview -->
        <div class="flex items-center space-x-4">
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
          <div class="text-xs text-foreground-2">
            updated
            <b>{{ updatedAt }}</b>
          </div>
          <div class="text-xs text-foreground-2">
            <FormButton
              rounded
              size="xs"
              :icon-right="ArrowTopRightOnSquareIcon"
              :to="viewAllUrl"
              :disabled="!viewAllUrl"
              @click="trackFederateModels"
            >
              View All
            </FormButton>
          </div>
          <div :class="`ml-4 w-24 h-20`">
            <div
              class="w-full h-full rounded-md bg-primary-muted flex items-center justify-center"
            >
              <FolderIcon class="w-4 h-4 text-blue-500/50" />
            </div>
          </div>
        </div>
      </button>
      <!-- Children list -->
      <div
        v-if="hasChildren && expanded && !isPendingFileUpload(item)"
        class="pl-8 mt-4 space-y-4"
      >
        <div v-for="child in children" :key="child.fullName" class="flex">
          <div class="h-20 absolute -ml-8 flex items-center mt-0 mr-1 pl-1">
            <ChevronDownIcon class="w-4 h-4 rotate-45 text-foreground-2" />
          </div>

          <ProjectPageModelsStructureItem
            :item="child"
            :project-id="projectId"
            :can-contribute="canContribute"
            class="flex-grow"
            @model-updated="onModelUpdated"
            @create-submodel="emit('create-submodel', $event)"
          />
        </div>
        <ProjectPageModelsNewModelStructureItem
          v-if="canContribute"
          :project-id="projectId"
          :parent-model-name="item.fullName"
        />
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs'
import { modelVersionsRoute, modelRoute } from '~~/lib/common/helpers/route'
import {
  ChevronDownIcon,
  FolderIcon,
  CubeIcon,
  CubeTransparentIcon,
  PlusIcon,
  ArrowPathRoundedSquareIcon,
  ChatBubbleLeftRightIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/vue/24/solid'
import { ArrowUpOnSquareIcon } from '@heroicons/vue/24/outline'
import {
  PendingFileUploadFragment,
  SingleLevelModelTreeItemFragment
} from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import { projectModelChildrenTreeQuery } from '~~/lib/projects/graphql/queries'
import { has } from 'lodash-es'
import { Nullable } from '@speckle/shared'
import { useMixpanel } from '~~/lib/core/composables/mp'

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
  projectId: string
  canContribute?: boolean
  isSearchResult?: boolean
}>()

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

const expanded = ref(false)
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

  return dayjs(date).from(dayjs())
})

const modelLink = computed(() => {
  if (
    isPendingFileUpload(props.item) ||
    !props.item.model ||
    props.item.model?.versionCount.totalCount === 0
  )
    return null
  return modelRoute(props.projectId, props.item.model.id)
})

const viewAllUrl = computed(() => {
  if (isPendingFileUpload(props.item)) return undefined
  return modelRoute(props.projectId, `$${props.item.fullName}`)
})

const { result: childrenResult, refetch: refetchChildren } = useQuery(
  projectModelChildrenTreeQuery,
  () => ({
    projectId: props.projectId,
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
</script>
