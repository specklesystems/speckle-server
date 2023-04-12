<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        :to="projectRoute(project.id)"
        :name="project.name"
      ></HeaderNavLink>
      <HeaderNavLink
        :to="allProjectModelsRoute(project.id)"
        name="Models"
      ></HeaderNavLink>
    </Portal>
    <div
      class="flex flex-col space-y-2 md:space-y-0 md:flex-row md:justify-between md:items-center mb-4"
    >
      <div class="flex justify-between items-center">
        <h1 class="block h4 font-bold">All Models</h1>
        <FormButton
          v-if="canContribute"
          class="inline-flex sm:hidden"
          :icon-right="PlusIcon"
          @click="showNewDialog = true"
        >
          New
        </FormButton>
      </div>
      <div
        class="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:space-x-2"
      >
        <FormTextInput
          v-model="search"
          name="modelsearch"
          :show-label="false"
          placeholder="Search"
          class="bg-foundation shadow w-full md:w-40 lg:w-60"
          :show-clear="search !== ''"
          size="lg"
          @change="($event) => updateSearchImmediately($event.value)"
          @update:model-value="updateDebouncedSearch"
        ></FormTextInput>
        <div
          class="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0"
        >
          <FormSelectUsers
            v-model="finalSelectedMembers"
            :users="team"
            multiple
            selector-placeholder="All members"
            label="Filter by members"
            class="grow shrink sm:w-[120px] lg:w-44"
            clearable
          />
          <div class="flex items-center space-x-2 grow">
            <FormSelectSourceApps
              v-model="finalSelectedApps"
              :items="availableSourceApps"
              multiple
              selector-placeholder="All sources"
              label="Filter by sources"
              class="grow shrink w-[120px] lg:w-44"
              clearable
            />
            <LayoutGridListToggle
              v-model="finalGridOrList"
              v-tippy="'Swap Grid/Card View'"
              class="shrink-0"
            />
          </div>
          <FormButton
            v-if="canContribute"
            class="hidden sm:inline-flex"
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
import { SourceAppDefinition, SourceApps } from '@speckle/shared'
import { debounce } from 'lodash-es'
import { graphql } from '~~/lib/common/generated/gql'
import {
  FormUsersSelectItemFragment,
  ProjectModelsPageHeader_ProjectFragment
} from '~~/lib/common/generated/gql/graphql'
import { projectRoute, allProjectModelsRoute } from '~~/lib/common/helpers/route'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'
import { PlusIcon } from '@heroicons/vue/24/solid'
import { canModifyModels } from '~~/lib/projects/helpers/permissions'

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

const search = ref('')

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

const team = computed(() => props.project.team.map((t) => t.user))

const updateDebouncedSearch = debounce(() => {
  debouncedSearch.value = search.value.trim()
}, 500)

const updateSearchImmediately = (val?: string) => {
  updateDebouncedSearch.cancel()
  debouncedSearch.value = (val ?? search.value).trim()
}

watch(debouncedSearch, (newVal) => {
  if (newVal !== search.value) {
    search.value = newVal
  }
})
</script>
