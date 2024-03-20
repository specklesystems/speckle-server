<template>
  <div class="flex justify-between">
    <h1 class="block h4 font-bold">Models</h1>
    <div class="flex flex-col lg:flex-row gap-2 items-end">
      <div class="flex gap-2 order-2 lg:order-1 flex-col md:flex-row">
        <div class="flex flex-col order-2 md:order-1">
          <div
            class="flex flex-col md:flex-row gap-2 overflow-hidden transition-all duration-300 md:max-h-[120px]"
            :class="mobileFiltersExpanded ? 'max-h-[120px]' : 'max-h-0'"
          >
            <FormTextInput
              v-model="localSearch"
              name="modelsearch"
              :show-label="false"
              placeholder="Search"
              color="foundation"
              wrapper-classes="min-w-[200px] shrink-0"
              :show-clear="localSearch !== ''"
              @change="($event) => updateSearchImmediately($event.value)"
              @update:model-value="updateDebouncedSearch"
            ></FormTextInput>
            <FormSelectUsers
              v-model="finalSelectedMembers"
              :users="team"
              multiple
              selector-placeholder="All members"
              label="Filter by members"
              class="min-w-[200px] shrink-0"
              clearable
              fixed-height
            />
            <FormSelectSourceApps
              v-model="finalSelectedApps"
              :items="availableSourceApps"
              multiple
              selector-placeholder="All sources"
              label="Filter by sources"
              class="min-w-[120px] shrink-0"
              clearable
              fixed-height
            />
          </div>
        </div>
        <div class="flex order-1 md:order-2 justify-end gap-2">
          <FormButton
            class="md:hidden flex items-center gap-2 mb-2"
            color="secondary"
            @click="mobileFiltersExpanded = !mobileFiltersExpanded"
          >
            <span>Filters</span>
            <ChevronDownIcon
              class="h-4 w-4 transition-all duration-300"
              :class="mobileFiltersExpanded ? 'rotate-180' : ''"
            />
          </FormButton>
          <LayoutGridListToggle v-model="finalGridOrList" class="shrink-0 order-2" />
        </div>
      </div>

      <div class="order-1 lg:order-2 flex gap-2 justify-end">
        <FormButton
          color="secondary"
          :icon-right="CubeIcon"
          :to="allModelsRoute"
          class="hidden sm:flex shrink-0"
          @click="trackFederateAll"
        >
          View all in 3D
        </FormButton>
        <FormButton
          v-if="canContribute"
          class="shrink-0"
          :icon-right="PlusIcon"
          @click="showNewDialog = true"
        >
          New
        </FormButton>
      </div>
    </div>
    <ProjectPageModelsNewDialog v-model:open="showNewDialog" :project-id="project.id" />
  </div>
</template>
<script setup lang="ts">
import { SourceApps, SpeckleViewer } from '@speckle/shared'
import type { SourceAppDefinition } from '@speckle/shared'
import { debounce } from 'lodash-es'
import { graphql } from '~~/lib/common/generated/gql'
import type {
  FormUsersSelectItemFragment,
  ProjectModelsPageHeader_ProjectFragment
} from '~~/lib/common/generated/gql/graphql'
import { modelRoute } from '~~/lib/common/helpers/route'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'
import { PlusIcon, ChevronDownIcon } from '@heroicons/vue/24/solid'
import { canModifyModels } from '~~/lib/projects/helpers/permissions'
import { CubeIcon } from '@heroicons/vue/24/outline'
import { useMixpanel } from '~~/lib/core/composables/mp'

const emit = defineEmits<{
  (e: 'update:selected-members', val: FormUsersSelectItemFragment[]): void
  (e: 'update:selected-apps', val: SourceAppDefinition[]): void
  (e: 'update:grid-or-list', val: GridListToggleValue): void
  (e: 'update:search', val: string): void
}>()

graphql(`
  fragment ProjectModelsPageHeader_Project on Project {
    id
    name
    sourceApps
    role
    team {
      user {
        ...FormUsersSelectItem
      }
    }
  }
`)

const props = defineProps<{
  project: ProjectModelsPageHeader_ProjectFragment
  selectedMembers: FormUsersSelectItemFragment[]
  selectedApps: SourceAppDefinition[]
  search: string
  gridOrList: GridListToggleValue
  disabled?: boolean
}>()

const localSearch = ref('')
const mobileFiltersExpanded = ref(false)

const mp = useMixpanel()
const trackFederateAll = () =>
  mp.track('Viewer Action', {
    type: 'action',
    name: 'federation',
    action: 'view-all',
    source: 'project page'
  })

const canContribute = computed(() => canModifyModels(props.project))
const showNewDialog = ref(false)

const debouncedSearch = computed({
  get: () => props.search,
  set: (newVal) => emit('update:search', newVal)
})
const finalSelectedMembers = computed({
  get: () => props.selectedMembers,
  set: (newVal) => emit('update:selected-members', newVal)
})
const finalSelectedApps = computed({
  get: () => props.selectedApps,
  set: (newVal) => emit('update:selected-apps', newVal)
})
const finalGridOrList = computed({
  get: () => props.gridOrList,
  set: (newVal) => emit('update:grid-or-list', newVal)
})

const availableSourceApps = computed((): SourceAppDefinition[] =>
  SourceApps.filter((a) =>
    props.project.sourceApps.find((pa) => pa.toLowerCase().includes(a.searchKey))
  )
)

const allModelsRoute = computed(() => {
  const resourceIdString = SpeckleViewer.ViewerRoute.resourceBuilder()
    .addAllModels()
    .toString()
  return modelRoute(props.project.id, resourceIdString)
})

const team = computed(() => props.project.team.map((t) => t.user))

const updateDebouncedSearch = debounce(() => {
  debouncedSearch.value = localSearch.value.trim()
}, 500)

const updateSearchImmediately = (val?: string) => {
  updateDebouncedSearch.cancel()
  debouncedSearch.value = (val ?? localSearch.value).trim()
}

watch(debouncedSearch, (newVal) => {
  if (newVal !== localSearch.value) {
    localSearch.value = newVal
  }
})
</script>
