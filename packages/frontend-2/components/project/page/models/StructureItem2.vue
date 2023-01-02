<template>
  <div class="space-y-4">
    <NuxtLink
      v-if="itemType !== 'group'"
      class="group bg-foundation w-full py-1 pr-1 flex items-center rounded-md shadow hover:shadow-xl cursor-pointer hover:bg-primary-muted transition-all border-l-2 border-primary-muted hover:border-primary"
      :href="modelLink"
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
        <div class="flex flex-col justify-start">
          <span class="text-lg font-bold text-foreground">{{ name }}</span>
        </div>
        <!-- Empty model action -->
        <div
          v-if="itemType === 'emptyModel'"
          class="ml-2 opacity-0 group-hover:opacity-100 transition duration-200 text-xs text-foreground-2 flex items-center space-x-1"
        >
          <PlusIcon class="w-3 h-3 text-foreground-2 hover:text-primary" />
          submodel
        </div>
        <!-- Spacer -->
        <div class="flex-grow"></div>
        <!-- Full model items -->
        <div
          v-if="itemType === 'fullModel' || itemType === 'mixed'"
          class="flex items-center space-x-10"
        >
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
              rounded
              size="xs"
              :icon-left="ArrowPathRoundedSquareIcon"
              :to="`/projects/${route.params.id}/models/${item.model?.id}/versions`"
            >
              {{ model?.versionCount }}
            </FormButton>
          </div>
        </div>
        <div
          v-if="itemType === 'emptyModel'"
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
          itemType === 'fullModel' || itemType === 'mixed'
            ? 'hover:w-44 hover:h-44 transition-all'
            : ''
        }`"
      >
        <ProjectPageModelsModelPreview
          v-if="itemType === 'fullModel' || itemType === 'mixed'"
          :model="(item.model as Model)"
          class="rounded-md shadow bg-foundation-2"
        />
        <div
          v-if="itemType === 'emptyModel'"
          class="w-full h-full rounded-md bg-primary-muted flex flex-col items-center justify-center"
        >
          <PlusIcon class="w-6 h-6 text-blue-500/50" />
        </div>
      </div>
    </NuxtLink>
    <!-- Doubling up for mixed items -->
    <div
      v-if="itemType === 'mixed' || itemType === 'group'"
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
        <div class="flex items-center">
          <!-- <div v-show="!expanded" class="flex items-center"> -->
          <div
            v-for="(child, index) in item.children"
            :key="index"
            :class="`w-16 h-16 ml-2`"
          >
            <div
              class="w-full h-full rounded-md bg-primary-muted shadow flex items-center justify-center text-blue-500/50 text-xs"
            >
              {{ child?.name }}
            </div>
          </div>
          <!-- </div> -->
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
        <div v-for="subitem in children" :key="subitem?.name" class="flex">
          <div class="h-20 absolute -ml-8 flex items-center mt-0 mr-1 pl-1">
            <ChevronDownIcon class="w-4 h-4 rotate-45 text-foreground-2" />
          </div>

          <StructureItem2
            :item="(subitem as StructuredModel)"
            :depth="depth + 1"
            :parents="[...parents, item]"
            class="flex-grow"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { PropType } from 'vue'
import dayjs from 'dayjs'
import { StructuredModel, Model } from '~~/lib/common/generated/gql/graphql'

import {
  ChevronDownIcon,
  FolderIcon,
  CubeIcon,
  CubeTransparentIcon,
  PlusIcon,
  ArrowPathRoundedSquareIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/vue/24/solid'

const props = defineProps({
  item: {
    type: Object as PropType<StructuredModel>,
    default: () => {
      return null
    }
  },
  parents: {
    type: Array as PropType<StructuredModel[]>,
    default: () => []
  },
  depth: {
    type: Number,
    default: 0
  }
})

type StructureItemType = 'emptyModel' | 'fullModel' | 'group' | 'mixed' | 'unknown'

const itemType = computed<StructureItemType>(() => {
  const item = props.item
  if (
    (!item.model && item.children?.length !== 0) ||
    (item.model?.versionCount === 0 && item.children?.length !== 0) // if it's an empty model with children, it's a group
  )
    return 'group'
  if (item.model?.versionCount !== 0 && item.children?.length !== 0) return 'mixed' // backwards compatibility
  if (item.model?.versionCount !== 0 && item.children?.length === 0) return 'fullModel' // classic branch
  if (item.model?.versionCount === 0) return 'emptyModel'
  return 'unknown'
})

const expanded = ref(false)
// const expanded = ref(props.depth === 0)

const name = computed(() => props.item.name)
const model = computed(() => props.item.model)
const hasChildren = computed(
  () => props.item.children && props.item.children?.length > 0
)
const children = computed(() => props.item.children)
const updatedAt = computed(() =>
  dayjs(props.item.model ? props.item.model?.updatedAt : dayjs()).from(dayjs())
)
const createdAt = computed(() =>
  dayjs(props.item.model ? props.item.model?.createdAt : dayjs()).from(dayjs())
)

const modelLink = computed(() => {
  if (props.item.model?.versionCount === 0) return null
  return `/projects/${route.params.id as string}/models/${
    props.item.model?.id as string
  }`
})

const path = computed(() => {
  const parts = props.parents.map((p) => p.name)
  return parts.join('/')
})
const fullName = computed(() => `${path.value}/${props.item.name}`)

const route = useRoute()
</script>
