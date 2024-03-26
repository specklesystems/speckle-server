<template>
  <FormSelectBase
    v-model="selectedValue"
    :multiple="multiple"
    :items="items ?? SourceApps"
    :search="search"
    :search-placeholder="searchPlaceholder"
    :label="label"
    :show-label="showLabel"
    :name="name || 'sourceApps'"
    :filter-predicate="searchFilterPredicate"
    :clearable="clearable"
    :help="help"
    :label-id="labelId"
    :button-id="buttonId"
    by="name"
  >
    <template #nothing-selected>
      <template v-if="selectorPlaceholder">
        {{ selectorPlaceholder }}
      </template>
      <template v-else>
        {{ multiple ? 'Select apps' : 'Select an app' }}
      </template>
    </template>
    <template #something-selected="{ value }">
      <template v-if="isMultiItemArrayValue(value)">
        <div ref="elementToWatchForChanges" class="flex items-center space-x-0.5 h-5">
          <div
            ref="itemContainer"
            class="flex flex-wrap overflow-hidden space-x-0.5 h-5"
          >
            <SourceAppBadge v-for="item in value" :key="item.name" :source-app="item" />
          </div>
          <div v-if="hiddenSelectedItemCount > 0" class="text-foreground-2 normal">
            +{{ hiddenSelectedItemCount }}
          </div>
        </div>
      </template>
      <template v-else>
        <div class="flex items-center">
          <div
            class="h-2 w-2 rounded-full mr-2"
            :style="{ backgroundColor: firstItem(value).bgColor }"
          />
          <span class="truncate">{{ firstItem(value).name }}</span>
        </div>
      </template>
    </template>
    <template #option="{ item }">
      <div class="flex items-center">
        <div
          class="h-2 w-2 rounded-full mr-2"
          :style="{ backgroundColor: item.bgColor }"
        />
        <span class="truncate">{{ item.name }}</span>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import type { Nullable, Optional, SourceAppDefinition } from '@speckle/shared'
import { SourceApps } from '@speckle/shared'
import { ref, toRefs } from 'vue'
import type { PropType } from 'vue'
import { useFormSelectChildInternals } from '~~/src/composables/form/select'
import FormSelectBase from '~~/src/components/form/select/Base.vue'
import SourceAppBadge from '~~/src/components/SourceAppBadge.vue'

type ValueType = SourceAppDefinition | SourceAppDefinition[] | undefined

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const props = defineProps({
  /**
   * Whether to allow selecting multiple source apps
   */
  multiple: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: [Object, Array] as PropType<ValueType>,
    default: undefined
  },
  /**
   * Whether to allow filtering source apps through a search box
   */
  search: {
    type: Boolean,
    default: false
  },
  /**
   * Search placeholder text
   */
  searchPlaceholder: {
    type: String,
    default: 'Search apps'
  },
  selectorPlaceholder: {
    type: String as PropType<Optional<string>>,
    default: undefined
  },
  /**
   * Label is required at the very least for screen-readers
   */
  label: {
    type: String,
    required: true
  },
  /**
   * Whether to show the label visually
   */
  showLabel: {
    type: Boolean,
    default: false
  },
  name: {
    type: String as PropType<Optional<string>>,
    default: undefined
  },
  /**
   * Control source apps to show. If left undefined, will show all available options.
   */
  items: {
    type: Array as PropType<Optional<SourceAppDefinition[]>>,
    default: undefined
  },
  clearable: {
    type: Boolean
  },
  help: {
    type: String
  },
  labelId: {
    type: String
  },
  buttonId: {
    type: String
  }
})

const elementToWatchForChanges = ref(null as Nullable<HTMLElement>)
const itemContainer = ref(null as Nullable<HTMLElement>)

const { selectedValue, hiddenSelectedItemCount, isMultiItemArrayValue, firstItem } =
  useFormSelectChildInternals<SourceAppDefinition>({
    props: toRefs(props),
    emit,
    dynamicVisibility: { elementToWatchForChanges, itemContainer }
  })

const searchFilterPredicate = (i: SourceAppDefinition, search: string) =>
  i.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())
</script>
