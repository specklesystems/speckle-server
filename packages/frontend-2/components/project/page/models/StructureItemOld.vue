<template>
  <!--
  NOTE: DEPRECATED.
  Keeping around as it has a view that combines a model card with a group card.
  -->
  <div
    class="border-l-2 border-primary-muted hover:border-primary transition-all rounded-md"
  >
    <button
      class="group bg-foundation w-full py-1 pr-1 flex items-center rounded-md shadow hover:shadow-md cursor-pointer hover:bg-primary-muted transition-all"
      href="/test"
      @click.stop="handleMainCardClick"
    >
      <div class="flex items-center flex-grow">
        <button
          v-if="hasChildren"
          class="mx-2 flex items-center hover:text-primary text-foreground-2 h-16"
          @click.stop="expanded = !expanded"
        >
          <ChevronDownIcon
            :class="`w-4 h-4 transition ${expanded ? 'rotate-180' : ''}`"
          />
        </button>
        <CubeIcon
          v-if="model && !hasChildren && model.versionCount !== 0"
          class="w-4 h-4 text-foreground-2 mx-2"
        />
        <CubeTransparentIcon
          v-if="model && !hasChildren && model.versionCount === 0"
          class="w-4 h-4 text-foreground-2 mx-2"
        />
        <div class="flex flex-col justify-start">
          <span class="font-bold text-foreground">{{ name }}</span>
        </div>
        <div
          v-if="itemType === 'emptyModel' || itemType === 'group'"
          class="ml-2 opacity-0 group-hover:opacity-100 transition duration-200 text-xs text-foreground-2 flex items-center space-x-1"
        >
          <PlusIcon class="w-3 h-3 text-foreground-2 hover:text-primary" />
          submodel
        </div>
        <div class="flex-grow"></div>
        <!-- <div class="text-xs text-foreground-2 mr-2">
          <b>{{ item.children?.length }}</b>
          submodels
        </div> -->
        <div
          v-if="itemType === 'fullModel' || itemType === 'mixed'"
          class="flex items-center space-x-10"
        >
          <div class="text-xs text-foreground-2">
            updated
            <b>{{ updatedAt }}</b>
          </div>
          <div class="text-xs text-foreground-2">
            {{ model?.commentThreadCount }} comments
          </div>
          <div class="text-xs text-foreground-2">
            <FormButton
              rounded
              size="xs"
              :icon-left="ArrowPathRoundedSquareIcon"
              :to="`models/${item.model?.id}/versions`"
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
          <!-- <div>OR</div>
          <div>create a submodel</div> -->
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
        <ProjectPageModelsPreview
          v-if="model && model.versionCount !== 0"
          :model="item.model"
          :depth="depth + 1"
          class="rounded-md shadow bg-foundation-2"
        />
        <div
          v-if="model && model.versionCount === 0 && children?.length === 0"
          class="w-full h-full rounded-md bg-primary-muted flex flex-col items-center justify-center"
        >
          <PlusIcon class="w-6 h-6 text-blue-500/50" />
        </div>
        <div
          v-if="itemType === 'group'"
          class="w-full h-full rounded-md bg-primary-muted flex items-center justify-center"
        >
          <span class="text-blue-500/50 mr-1 text-sm">{{ item.children?.length }}</span>
          <FolderIcon class="w-4 h-4 text-blue-500/50" />
        </div>
      </div>
    </button>
    <div v-if="hasChildren && expanded" class="pl-8 mt-4 space-y-4 max-w-full">
      <div v-for="subitem in children" :key="subitem?.name" class="flex">
        <!-- <div
            class="h-8 w-4 absolute -ml-8 flex items-center mt-2 mr-1 border-l border-b pl-1 border-foreground-2"
          > -->
        <div class="h-20 absolute -ml-8 flex items-center mt-0 mr-1 pl-1">
          <ChevronDownIcon class="w-4 h-4 rotate-45 text-foreground-2" />
        </div>

        <StructureItem
          :item="(subitem as StructuredModel)"
          :depth="depth + 1"
          :parents="[...parents, item]"
          class="flex-grow"
        />
      </div>
    </div>
    <!-- </Transition> -->
  </div>
</template>
<script lang="ts" setup>
/* eslint-disable */
import { PropType } from 'vue'
import dayjs from 'dayjs'

import {
  ChevronDownIcon,
  FolderIcon,
  CubeIcon,
  CubeTransparentIcon,
  PlusIcon,
  ArrowPathRoundedSquareIcon
} from '@heroicons/vue/20/solid'
import { modelRoute } from '~~/lib/common/helpers/route'

/**
 * TODO: Delete if unused
 */

type StructuredModel = any
type StructureItemType = 'emptyModel' | 'fullModel' | 'group' | 'mixed' | 'unknown'

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

const route = useRoute()

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

function handleMainCardClick() {
  switch (itemType.value) {
    case 'mixed':
    case 'group':
      expanded.value = !expanded.value
      break
    case 'fullModel':
      if (route.params.id && props.item.model?.id) {
        navigateTo(modelRoute(route.params.id as string, props.item.model?.id))
      }
      break
    default:
      break
  }
}
</script>
