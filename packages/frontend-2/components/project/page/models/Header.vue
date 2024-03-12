<template>
  <div>
    <div class="flex flex-col xl:flex-row justify-between gap-4 xl:gap-8">
      <div class="flex justify-between">
        <h1 class="block h4 font-bold">Models</h1>
        <div class="xl:hidden">
          <FormButton
            color="secondary"
            :icon-right="CubeIcon"
            :to="allModelsRoute"
            class="shrink-0"
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
      <div class="flex gap-2 flex-col sm:flex-row justify-end">
        <FormTextInput
          v-model="localSearch"
          name="modelsearch"
          :show-label="false"
          placeholder="Search"
          color="foundation"
          wrapper-classes="xl:w-48 xl:w-60"
          :show-clear="localSearch !== ''"
          @change="($event) => updateSearchImmediately($event.value)"
          @update:model-value="updateDebouncedSearch"
        ></FormTextInput>
        <div class="flex flex-col sm:flex-row items-end justify-between gap-2">
          <div class="flex gap-2">
            <FormSelectUsers
              v-model="finalSelectedMembers"
              :users="team"
              multiple
              selector-placeholder="All members"
              label="Filter by members"
              class="w-52"
              clearable
              fixed-height
            />
            <FormSelectSourceApps
              v-model="finalSelectedApps"
              :items="availableSourceApps"
              multiple
              selector-placeholder="All sources"
              label="Filter by sources"
              class="w-52"
              clearable
              fixed-height
            />
          </div>
          <LayoutGridListToggle v-model="finalGridOrList" class="shrink-0" />
          <FormButton
            color="secondary"
            :icon-right="CubeIcon"
            :to="allModelsRoute"
            class="hidden xl:inline-flex shrink-0"
            @click="trackFederateAll"
          >
            View all in 3D
          </FormButton>
          <FormButton
            v-if="canContribute"
            class="hidden xl:inline-flex shrink-0"
            :icon-right="PlusIcon"
            @click="showNewDialog = true"
          >
            New
          </FormButton>
        </div>
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
import { PlusIcon } from '@heroicons/vue/24/solid'
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
