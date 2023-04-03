<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div class="space-y-4 relative" @mouseleave="showActionsMenu = false">
    <!--
      Nested anchors are causing a hydration mismatch for some reason (template renders wrong in SSR), could be a Vue bug?
      TODO: Report it to Vue/Nuxt!
    -->
    <NuxtLink
      v-if="itemType !== StructureItemType.ModelWithOnlySubmodels"
      class="group bg-foundation w-full py-1 pr-1 flex rounded-md shadow hover:shadow-xl cursor-pointer hover:bg-primary-muted transition-all border-l-2 border-primary-muted hover:border-primary items-stretch"
      :to="modelLink || ''"
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
          <span class="text-lg font-bold text-foreground">
            {{ name }}
          </span>
          <span v-if="model" class="opacity-0 group-hover:opacity-100 transition">
            <ProjectPageModelsActions
              v-model:open="showActionsMenu"
              :model="model"
              :project-id="projectId"
              :can-edit="canContribute"
              @click.stop.prevent
              @model-updated="$emit('model-updated')"
            />
          </span>
        </div>
        <!-- Empty model action -->
        <div
          v-if="itemType === StructureItemType.EmptyModel"
          class="ml-2 opacity-0 group-hover:opacity-100 transition duration-200 text-xs text-foreground-2 flex items-center space-x-1"
        >
          <PlusIcon class="w-3 h-3 text-foreground-2 hover:text-primary" />
          submodel
        </div>
        <!-- Spacer -->
        <div class="flex-grow"></div>
        <!-- Full model items -->
        <div v-if="hasVersions" class="flex items-center space-x-10">
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
              v-if="item.model"
              rounded
              size="xs"
              :icon-left="ArrowPathRoundedSquareIcon"
              :to="modelVersionsRoute(projectId, item.model.id)"
            >
              {{ model?.versionCount.totalCount }}
            </FormButton>
          </div>
        </div>
        <div
          v-else-if="itemType === StructureItemType.EmptyModel"
          class="flex items-center h-full"
        >
          <div
            v-if="pendingVersion"
            class="px-4 w-full text-foreground-2 text-sm flex flex-col items-center space-y-1"
          >
            <template
              v-if="
                [
                  FileUploadConvertedStatus.Queued,
                  FileUploadConvertedStatus.Converting
                ].includes(pendingVersion.convertedStatus)
              "
            >
              <span>Importing new version</span>
              <CommonLoadingBar loading class="max-w-[100px]" />
            </template>
            <template
              v-else-if="
                pendingVersion.convertedStatus === FileUploadConvertedStatus.Completed
              "
            >
              <span class="inline-flex items-center space-x-1">
                <CheckCircleIcon class="h-4 w-4 text-success" />
                <span>Version import successful</span>
              </span>
            </template>
            <template v-else>
              <span class="inline-flex items-center space-x-1">
                <ExclamationTriangleIcon class="h-4 w-4 text-danger" />
                <span>Version import failed</span>
              </span>
              <span v-if="pendingVersion.convertedMessage">
                {{ pendingVersion.convertedMessage }}
              </span>
            </template>
          </div>
          <ProjectCardImportFileArea
            v-else
            :project-id="projectId"
            :model-name="item.fullName"
            class="h-full w-full"
          />
        </div>
        <div
          v-else-if="pendingModel && itemType === StructureItemType.PendingModel"
          class="text-foreground-2 text-sm flex flex-col items-center space-y-1 mr-4"
        >
          <template
            v-if="
              [
                FileUploadConvertedStatus.Queued,
                FileUploadConvertedStatus.Converting
              ].includes(pendingModel.convertedStatus)
            "
          >
            <span>Importing</span>
            <CommonLoadingBar loading class="max-w-[100px]" />
          </template>
          <template
            v-else-if="
              pendingModel.convertedStatus === FileUploadConvertedStatus.Completed
            "
          >
            <span class="inline-flex items-center space-x-1">
              <CheckCircleIcon class="h-4 w-4 text-success" />
              <span>Importing successful</span>
            </span>
          </template>
          <template v-else>
            <span class="inline-flex items-center space-x-1">
              <ExclamationTriangleIcon class="h-4 w-4 text-danger" />
              <span>Importing failed</span>
            </span>
            <span v-if="pendingModel.convertedMessage">
              {{ pendingModel.convertedMessage }}
            </span>
          </template>
        </div>
      </div>
      <!-- Preview or icon section -->
      <div v-if="item.model?.previewUrl" class="w-24 h-20 ml-4">
        <PreviewImage
          v-if="item.model?.previewUrl"
          :preview-url="item.model.previewUrl"
        />
      </div>
      <div v-else class="h-20" />
    </NuxtLink>
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
      <div v-if="hasChildren && expanded" class="pl-8 mt-4 space-y-4">
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
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/solid'
import { ArrowUpOnSquareIcon } from '@heroicons/vue/24/outline'
import { SingleLevelModelTreeItemFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import { projectModelChildrenTreeQuery } from '~~/lib/projects/graphql/queries'
import { FileUploadConvertedStatus } from '~~/lib/core/api/fileImport'

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
    pendingModel {
      ...PendingFileUpload
    }
    hasChildren
    updatedAt
  }
`)

const emit = defineEmits<{
  (e: 'model-updated'): void
}>()

const props = defineProps<{
  item: SingleLevelModelTreeItemFragment
  projectId: string
  canContribute?: boolean
  isSearchResult?: boolean
}>()

const expanded = ref(false)
const showActionsMenu = ref(false)

const isPendingFileUpload = computed(() => !!props.item.pendingModel?.id)
const itemType = computed<StructureItemType>(() => {
  if (isPendingFileUpload.value) return StructureItemType.PendingModel

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

const name = computed(() =>
  props.isSearchResult || isPendingFileUpload.value
    ? props.item.fullName
    : props.item.name
)
const model = computed(() => props.item.model)
const pendingModel = computed(() => props.item.pendingModel)
const pendingVersion = computed(() => model.value?.pendingImportedVersions[0])
const hasChildren = computed(() =>
  props.isSearchResult ? false : props.item.hasChildren
)

const updatedAt = computed(() =>
  dayjs(props.item.model ? props.item.model?.updatedAt : props.item.updatedAt).from(
    dayjs()
  )
)

const modelLink = computed(() => {
  if (!props.item.model || props.item.model?.versionCount.totalCount === 0) return null
  return modelRoute(props.projectId, props.item.model.id)
})

const viewAllUrl = computed(() => {
  return modelRoute(props.projectId, `$${props.item.fullName}`)
})

const { result: childrenResult, refetch: refetchChildren } = useQuery(
  projectModelChildrenTreeQuery,
  () => ({
    projectId: props.projectId,
    parentName: props.item.fullName
  }),
  () => ({ enabled: hasChildren.value && expanded.value })
)

const children = computed(() => childrenResult.value?.project?.modelChildrenTree || [])

const onModelUpdated = () => {
  emit('model-updated')
  refetchChildren()
}
</script>
