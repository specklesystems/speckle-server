<template>
  <FormSelectBase
    ref="select"
    v-model="selectedValue"
    :multiple="multiple"
    :search="true"
    :search-placeholder="searchPlaceholder"
    :get-search-results="invokeSearch"
    :label="label"
    :show-label="showLabel"
    :name="name || 'functionReleases'"
    :rules="rules"
    :validate-on-value-update="validateOnValueUpdate"
    :allow-unset="allowUnset"
    class="min-w-[180px]"
    by="id"
  >
    <template #nothing-selected>
      <template v-if="selectorPlaceholder">
        {{ selectorPlaceholder }}
      </template>
      <template v-else>
        {{ multiple ? 'Select releases' : 'Select a release' }}
      </template>
    </template>
    <template #something-selected="{ value }">
      <template v-if="isMultiItemArrayValue(value)">
        <div ref="elementToWatchForChanges" class="flex items-center space-x-0.5">
          <div
            ref="itemContainer"
            class="flex flex-wrap overflow-hidden space-x-0.5 h-6"
          >
            <div v-for="(item, i) in value" :key="item.id" class="text-foreground">
              {{ displayFunctionId(item) + (i < value.length - 1 ? ', ' : '') }}
            </div>
          </div>
          <div v-if="hiddenSelectedItemCount > 0" class="text-foreground-2 normal">
            +{{ hiddenSelectedItemCount }}
          </div>
        </div>
      </template>
      <template v-else>
        <div class="flex items-center">
          <span class="truncate text-foreground">
            {{ displayFunctionId(value) }}
          </span>
        </div>
      </template>
    </template>
    <template #option="{ item }">
      <div class="flex flex-col">
        <span class="truncate">{{ displayFunctionId(item) }}</span>
        <span class="label-light truncate text-foreground-2">
          {{ timeAgoCreatedAt(item) }}
        </span>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import type { Nullable, Optional } from '@speckle/shared'
import { useFormSelectChildInternals } from '@speckle/ui-components'
import { useApolloClient } from '@vue/apollo-composable'
import dayjs from 'dayjs'
import type { RuleExpression } from 'vee-validate'
import { searchAutomateFunctionReleasesQuery } from '~/lib/automate/graphql/queries'
import type { SearchAutomateFunctionReleaseItemFragment } from '~~/lib/common/generated/gql/graphql'

type ItemType = SearchAutomateFunctionReleaseItemFragment
type ValueType = ItemType | ItemType[] | undefined

const emit = defineEmits<(e: 'update:modelValue', v: ValueType) => void>()

const props = withDefaults(
  defineProps<{
    functionId: string
    label: string
    name?: string
    rules?: RuleExpression<ValueType>
    multiple?: boolean
    modelValue?: ValueType
    searchPlaceholder?: string
    selectorPlaceholder?: string
    showLabel?: boolean
    validateOnValueUpdate?: boolean
    allowUnset?: boolean
    /**
     * If you don't have the actual model required to set the initial modelValue, you can use
     * the async retrieval API call of this component to set it
     */
    resolveFirstModelValue?: (res: ItemType[]) => Optional<ItemType>
  }>(),
  {
    searchPlaceholder: 'Search releases'
  }
)

const { isLoggedIn } = useActiveUser()
const apollo = useApolloClient().client

const firstValueResolved = ref(false)
const select = ref(null as Nullable<{ triggerSearch: () => Promise<void> }>)
const elementToWatchForChanges = ref(null as Nullable<HTMLElement>)
const itemContainer = ref(null as Nullable<HTMLElement>)

const { selectedValue, hiddenSelectedItemCount, isMultiItemArrayValue } =
  useFormSelectChildInternals<ItemType>({
    props: toRefs(props),
    emit,
    dynamicVisibility: { elementToWatchForChanges, itemContainer }
  })

const displayFunctionId = (item: ItemType) => item.versionTag
const timeAgoCreatedAt = (item: ItemType) => dayjs(item.createdAt).from(dayjs())

const invokeSearch = async (search: string) => {
  if (!isLoggedIn.value) return []
  const results = await apollo.query({
    query: searchAutomateFunctionReleasesQuery,
    variables: {
      functionId: props.functionId,
      filter: {
        search: search.trim().length ? search : null
      }
    }
  })

  const res = results.data.automateFunction?.releases?.items || []
  if (!firstValueResolved.value && props.resolveFirstModelValue) {
    const resolvedVal = props.resolveFirstModelValue(res)
    if (resolvedVal) {
      selectedValue.value = resolvedVal
    }
  }
  firstValueResolved.value = true

  return res
}

watch(
  () => props.functionId,
  async () => {
    firstValueResolved.value = false
    await select.value?.triggerSearch()
  },
  { immediate: true }
)
</script>
