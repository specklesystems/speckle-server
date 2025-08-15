<template>
  <div class="flex w-full">
    <div
      :class="`grid grid-cols-3 w-full pl-2 h-5 items-center ${
        kvp.value === null || kvp.value === undefined ? 'text-foreground-2' : ''
      }`"
    >
      <div
        class="col-span-1 truncate text-body-3xs mr-2 font-medium text-foreground-2"
        :title="(kvp.key as string)"
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
              :class="isCopyable(kvp) ? 'cursor-pointer' : 'cursor-default'"
              class="opacity-0 group-hover:opacity-100 hover:bg-highlight-1 rounded h-4 w-4 flex items-center justify-center"
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
import { useFilterUtilities } from '~~/lib/viewer/composables/ui'
import { useInjectedViewer } from '~~/lib/viewer/composables/setup'
import type { PropertyInfo } from '@speckle/viewer'

const props = defineProps<{
  kvp: Record<string, unknown> & { key: string; value: unknown; units?: string }
}>()

const showActionsMenu = ref(false)

const { setPropertyFilter, applyPropertyFilter, isPropertyFilterable } =
  useFilterUtilities()
const {
  metadata: { availableFilters }
} = useInjectedViewer()

const isUrlString = (v: unknown) => typeof v === 'string' && VALID_HTTP_URL.test(v)

const isCopyable = (kvp: Record<string, unknown>) => {
  return kvp.value !== null && kvp.value !== undefined && typeof kvp.value !== 'object'
}

const isFilterable = (kvp: Record<string, unknown>) => {
  const key = kvp.key as string
  return isPropertyFilterable(key, availableFilters.value)
}

const handleFilterByProperty = (kvp: Record<string, unknown>) => {
  const key = kvp.key as string
  const filter = availableFilters.value?.find((f: PropertyInfo) => f.key === key)
  if (filter) {
    setPropertyFilter(filter)
    applyPropertyFilter()
  }
}

const handleCopy = async (kvp: Record<string, unknown>) => {
  const { copy } = useClipboard()
  if (isCopyable(kvp)) {
    const keyName = kvp.key as string
    await copy(kvp.value as string, {
      successMessage: `${keyName} copied to clipboard`,
      failureMessage: `Failed to copy ${keyName} to clipboard`
    })
  }
}

const actionsItems = computed<LayoutMenuItem[][]>(() => {
  return [
    [
      {
        title: 'Copy value',
        id: 'copy-value',
        disabled: !isCopyable(props.kvp),
        disabledTooltip: isCopyable(props.kvp)
          ? undefined
          : 'Cannot copy objects, arrays, or null values'
      }
    ],
    [
      {
        title: 'Filter by property',
        id: 'filter-by-property',
        disabled: !isFilterable(props.kvp),
        disabledTooltip: isFilterable(props.kvp)
          ? undefined
          : 'This property is not available for filtering'
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
    case 'filter-by-property':
      handleFilterByProperty(props.kvp)
      break
  }
}
</script>
