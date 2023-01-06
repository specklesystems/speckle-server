<template>
  <div class="space-y-4">
    <!--
      Nested anchors are causing a hydration mismatch for some reason (template renders wrong in SSR), could be a Vue bug?
      TODO: Report it to Vue/Nuxt!
    -->
    <NuxtLink
      v-if="itemType !== StructureItemType.ModelWithOnlySubmodels"
      class="group bg-foundation w-full py-1 pr-1 flex items-center rounded-md shadow hover:shadow-xl cursor-pointer hover:bg-primary-muted transition-all border-l-2 border-primary-muted hover:border-primary"
      :to="modelLink || ''"
    >
      <div class="flex items-center flex-grow">
        <!-- Icon -->
        <CubeIcon
          v-if="model && model.versionCount !== 0"
          class="w-4 h-4 text-foreground-2 mx-2"
        />
        <CubeTransparentIcon
          v-if="model && model.versionCount === 0"
          class="w-4 h-4 text-foreground-2 mx-2"
        />
        <!-- Name -->
        <div class="flex justify-start space-x-2 items-center">
          <span class="text-lg font-bold text-foreground">{{ name }}</span>
          <span v-if="model" class="opacity-0 group-hover:opacity-100 transition">
            <!-- TODO: copy model link -->
            <LinkIcon class="w-3 h-3" />
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
            <span>{{ model?.commentThreadCount }}</span>
            <ChatBubbleLeftRightIcon class="w-4 h-4" />
          </div>
          <div class="text-xs text-foreground-2">
            <FormButton
              v-if="item.model"
              rounded
              size="xs"
              :icon-left="ArrowPathRoundedSquareIcon"
              :to="modelVersionsRoute(route.params.id as string, item.model.id)"
            >
              {{ model?.versionCount }}
            </FormButton>
          </div>
        </div>
        <div
          v-if="itemType === StructureItemType.EmptyModel"
          class="flex items-center space-x-2 text-foreground-2 text-xs"
        >
          <div class="text-right opacity-50 group-hover:opacity-100 transition">
            Use our
            <b>connectors</b>
            to send data to this model,
            <br />
            or drag and drop a IFC/OBJ/STL file here.
          </div>
        </div>
      </div>
      <!-- Preview or icon section -->
      <div
        :class="`w-24 h-20 ml-4 ${
          hasVersions ? 'hover:w-44 hover:h-44 transition-all' : ''
        }`"
      >
        <PreviewImage
          v-if="hasVersions && item.model && item.model.previewUrl"
          :preview-url="item.model.previewUrl"
        />

        <div
          v-if="itemType === StructureItemType.EmptyModel"
          class="w-full h-full rounded-md bg-primary-muted flex flex-col items-center justify-center"
        >
          <PlusIcon class="w-6 h-6 text-blue-500/50" />
        </div>
      </div>
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
            <!-- TODO: 
            Open all child models in one viewer page. 
            Fabs will hate me as we might need to go back to "getting everything", or hacking away a 
            request for all the kids -->
            <FormButton
              rounded
              size="xs"
              :icon-right="ArrowTopRightOnSquareIcon"
              disabled
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
            class="flex-grow"
          />
        </div>
        <ProjectPageModelsNewModelStructureItem />
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
  LinkIcon
} from '@heroicons/vue/24/solid'
import { SingleLevelModelTreeItemFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import { projectModelChildrenTreeQuery } from '~~/lib/projects/graphql/queries'

enum StructureItemType {
  EmptyModel, // emptyModel
  ModelWithOnlyVersions, // fullModel
  ModelWithOnlySubmodels, // group
  ModelWithVersionsAndSubmodels // mixed
}

graphql(`
  fragment SingleLevelModelTreeItem on ModelsTreeItem {
    name
    fullName
    model {
      ...ProjectModelsViewModelItem
    }
    hasChildren
    updatedAt
  }
`)

const props = defineProps<{
  item: SingleLevelModelTreeItemFragment
  projectId: string
}>()
const route = useRoute()

const expanded = ref(false)

const itemType = computed<StructureItemType>(() => {
  const item = props.item

  if (item.model?.versionCount) {
    if (item.hasChildren) {
      return StructureItemType.ModelWithVersionsAndSubmodels
    } else {
      return StructureItemType.ModelWithOnlyVersions
    }
  } else {
    if (item.hasChildren) {
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

const name = computed(() => props.item.name)
const model = computed(() => props.item.model)
const hasChildren = computed(() => props.item.hasChildren)

const updatedAt = computed(() =>
  dayjs(props.item.model ? props.item.model?.updatedAt : props.item.updatedAt).from(
    dayjs()
  )
)

const modelLink = computed(() => {
  if (!props.item.model || props.item.model?.versionCount === 0) return null
  return modelRoute(route.params.id as string, props.item.model.id)
})

const { result: childrenResult } = useQuery(
  projectModelChildrenTreeQuery,
  () => ({
    projectId: props.projectId,
    parentName: props.item.fullName
  }),
  () => ({ enabled: hasChildren.value && expanded.value })
)

const children = computed(() => childrenResult.value?.project?.modelChildrenTree || [])
</script>
