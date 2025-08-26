<template>
  <div class="flex w-full">
    <div
      :class="`grid grid-cols-3 w-full pl-2 h-5 items-center ${
        kvp.value === null || kvp.value === undefined ? 'text-foreground-2' : ''
      }`"
    >
      <div
        class="col-span-1 truncate text-body-3xs mr-2 font-medium text-foreground-2"
        :title="kvp.key"
      >
        {{ kvp.key }}
      </div>
      <div
        class="group col-span-2 pl-1 truncate text-body-3xs flex gap-1 items-center text-foreground"
        :title="(kvp.value as string)"
      >
        <div class="flex gap-1 items-center w-full">
          <!-- NOTE: can't do kvp.value || 'null' because 0 || 'null' = 'null' -->
          <template v-if="isUrlString(kvp.value)">
            <a
              :href="kvp.value as string"
              target="_blank"
              rel="noopener"
              class="truncate border-b border-outline-3 hover:border-outline-5"
              :class="kvp.value === null ? '' : 'group-hover:max-w-[calc(100%-1rem)]'"
            >
              {{ kvp.value }}
            </a>
          </template>
          <template v-else>
            <span
              class="truncate"
              :class="kvp.value === null ? '' : 'group-hover:max-w-[calc(100%-1rem)]'"
            >
              {{ kvp.value === null ? 'null' : kvp.value }}
            </span>
          </template>
          <span v-if="kvp.units" class="truncate opacity-70">
            {{ kvp.units }}
          </span>
          <LayoutMenu
            v-model:open="showActionsMenu"
            :items="actionsItems"
            mount-menu-on-body
            @click.stop.prevent
            @chosen="onActionChosen"
          >
            <button
              class="group-hover:opacity-100 hover:bg-highlight-1 rounded h-4 w-4 flex items-center justify-center"
              :class="showActionsMenu ? 'bg-highlight-1 opacity-100' : 'opacity-0'"
              @click="showActionsMenu = !showActionsMenu"
            >
              <Ellipsis class="h-3 w-3" />
            </button>
          </LayoutMenu>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VALID_HTTP_URL } from '~~/lib/common/helpers/validation'
import { LayoutMenu, type LayoutMenuItem } from '@speckle/ui-components'
import { Ellipsis } from 'lucide-vue-next'
import { useFilterUtilities } from '~~/lib/viewer/composables/filtering'
import { useInjectedViewer } from '~~/lib/viewer/composables/setup'
import type { KeyValuePair } from '~/components/viewer/selection/types'
import { isNumericPropertyInfo } from '~/lib/viewer/helpers/sceneExplorer'

const props = defineProps<{
  kvp: KeyValuePair
}>()

const {
  isKvpFilterable,
  getFilterDisabledReason,
  findFilterByKvp,
  addActiveFilter,
  updateActiveFilterValues,
  toggleFilterApplied,
  setNumericRange
} = useFilterUtilities()

const {
  metadata: { availableFilters }
} = useInjectedViewer()

const showActionsMenu = ref(false)

const isUrlString = (v: unknown) => typeof v === 'string' && VALID_HTTP_URL.test(v)

const isCopyable = computed(() => {
  return (
    props.kvp.value !== null &&
    props.kvp.value !== undefined &&
    typeof props.kvp.value !== 'object'
  )
})

const isFilterable = computed(() => {
  return isKvpFilterable(props.kvp, availableFilters.value)
})

const getDisabledReason = computed(() => {
  return getFilterDisabledReason(props.kvp, availableFilters.value)
})

const handleAddToFilters = (kvp: KeyValuePair) => {
  const filter = findFilterByKvp(kvp, availableFilters.value)
  if (filter && kvp.value !== null && kvp.value !== undefined) {
    const filterId = addActiveFilter(filter)

    if (isNumericPropertyInfo(filter)) {
      // For numeric filters, set the specific numeric value
      const numericValue =
        typeof kvp.value === 'number' ? kvp.value : parseFloat(String(kvp.value))
      if (!isNaN(numericValue)) {
        setNumericRange(filterId, numericValue, numericValue)
      }
    } else {
      // For string filters, use the selectedValues array
      const values = [String(kvp.value)]
      updateActiveFilterValues(filterId, values)
      toggleFilterApplied(filterId)
    }
  }
}

const handleCopy = async (kvp: KeyValuePair) => {
  const { copy } = useClipboard()
  if (isCopyable.value) {
    await copy(kvp.value as string, {
      successMessage: `${kvp.key} copied to clipboard`,
      failureMessage: `Failed to copy ${kvp.key} to clipboard`
    })
  }
}

const actionsItems = computed<LayoutMenuItem[][]>(() => {
  return [
    [
      {
        title: 'Copy value',
        id: 'copy-value',
        disabled: !isCopyable.value,
        disabledTooltip: isCopyable.value
          ? undefined
          : 'Cannot copy objects, arrays, or null values'
      }
    ],
    [
      {
        title: 'Add to filters',
        id: 'add-to-filters',
        disabled: !isFilterable.value,
        disabledTooltip: isFilterable.value
          ? 'Add this property to filters'
          : getDisabledReason.value
      }
    ]
  ]
})

const onActionChosen = (params: { item: LayoutMenuItem }) => {
  const { item } = params

  // Don't execute if item is disabled
  if (item.disabled) return

  switch (item.id) {
    case 'copy-value':
      handleCopy(props.kvp)
      break
    case 'add-to-filters':
      handleAddToFilters(props.kvp)
      break
  }
}
</script>
