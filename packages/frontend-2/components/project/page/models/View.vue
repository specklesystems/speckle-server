<template>
  <div>
    <div
      class="flex flex-col space-y-2 justify-between mb-4 lg:flex-row lg:space-y-0 lg:space-x-2"
    >
      <div class="flex items-center space-x-2 flex-grow">
        <h2 class="h4 font-bold">Models</h2>
        <!-- <FormButton size="sm" rounded>New</FormButton> -->
      </div>
      <div class="flex items-center space-x-2">
        <FormButton :icon-left="PlusIcon" @click="showNewDialog = true">New</FormButton>
        <FormTextInput
          v-model="search"
          name="modelsearch"
          :show-label="false"
          placeholder="Search"
          class="bg-foundation shadow w-60"
          :show-clear="search !== ''"
          @change="updateSearchImmediately"
          @update:model-value="updateDebouncedSearch"
        ></FormTextInput>
        <div
          class="flex items-center justify-center rounded bg-foundation h-8 w-8 shadow"
        >
          <LayoutGridListToggle v-model="gridOrList" />
        </div>
      </div>
    </div>
    <CommonLoadingBar :loading="showLoadingBar" class="my-2" />
    <div class="mb-14">
      <div :class="queryLoading ? 'hidden' : 'block'">
        <ProjectPageModelsListView
          v-if="gridOrList === GridListToggleValue.List"
          :search="debouncedSearch"
          :project="project"
          @update:loading="queryLoading = $event"
        />
        <ProjectPageModelsCardView
          v-if="gridOrList === GridListToggleValue.Grid"
          :search="debouncedSearch"
          :project="project"
          @update:loading="queryLoading = $event"
        />
      </div>
    </div>
    <ProjectPageModelsNewDialog v-model:open="showNewDialog" :project-id="project.id" />
  </div>
</template>
<script setup lang="ts">
import { ProjectPageModelsViewFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'
import { debounce } from 'lodash-es'
import { PlusIcon } from '@heroicons/vue/24/solid'
defineProps<{
  project: ProjectPageModelsViewFragment
}>()

graphql(`
  fragment ProjectPageModelsView on Project {
    id
    modelCount
    sourceApps
    team {
      ...FormUsersSelectItem
    }
  }
`)

graphql(`
  fragment ProjectModelsViewModelItem on Model {
    id
    name
    versionCount
    commentThreadCount
    previewUrl
    updatedAt
  }
`)

const queryLoading = ref(false)
const search = ref('')
const debouncedSearch = ref('')
const showNewDialog = ref(false)
const showLoadingBar = ref(false)

const viewTypeCookie = useSynchronizedCookie(`projectPage-models-viewType`)
const gridOrList = computed({
  get: () =>
    viewTypeCookie.value === GridListToggleValue.List
      ? GridListToggleValue.List
      : GridListToggleValue.Grid,
  set: (newVal) => (viewTypeCookie.value = newVal)
})

const updateDebouncedSearch = debounce(() => {
  debouncedSearch.value = search.value.trim()
}, 500)

const updateSearchImmediately = () => {
  updateDebouncedSearch.cancel()
  debouncedSearch.value = search.value.trim()
}

watch(search, (newVal) => {
  if (newVal) showLoadingBar.value = true
  else showLoadingBar.value = false
})

watch(queryLoading, (newVal) => (showLoadingBar.value = newVal))
</script>
