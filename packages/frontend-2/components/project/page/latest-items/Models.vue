<template>
  <ProjectPageLatestItems
    :count="project.modelCount.totalCount"
    :title="title"
    :see-all-url="allProjectModelsRoute(project.id)"
    hide-grid-list-toggle
    hide-heading-bottom-margin
  >
    <template #default>
      <CommonLoadingBar :loading="showLoadingBar" class="my-2" />
      <div :class="queryLoading ? 'hidden' : 'block'">
        <ProjectPageModelsListView
          v-if="gridOrList === GridListToggleValue.List"
          :search="debouncedSearch"
          :project="project"
          @update:loading="queryLoading = $event"
          @clear-search=";(search = ''), updateSearchImmediately()"
        />
        <ProjectPageModelsCardView
          v-if="gridOrList === GridListToggleValue.Grid"
          :search="debouncedSearch"
          :project="project"
          @update:loading="queryLoading = $event"
          @clear-search=";(search = ''), updateSearchImmediately()"
        />
      </div>
      <ProjectPageModelsNewDialog
        v-model:open="showNewDialog"
        :project-id="project.id"
      />
    </template>
    <template #filters>
      <div class="flex flex-row items-center space-x-2">
        <FormTextInput
          v-model="search"
          name="modelsearch"
          :show-label="false"
          placeholder="Search"
          class="bg-foundation shadow w-60"
          :show-clear="search !== ''"
          @change="($event) => updateSearchImmediately($event.value)"
          @update:model-value="updateDebouncedSearch"
        ></FormTextInput>
        <LayoutGridListToggle v-model="gridOrList" v-tippy="'Swap Grid/Card View'" />
        <FormButton
          v-if="canContribute"
          :icon-left="PlusIcon"
          @click="showNewDialog = true"
        >
          New
        </FormButton>
      </div>
    </template>
  </ProjectPageLatestItems>
</template>
<script setup lang="ts">
import { GridListToggleValue } from '~~/lib/layout/helpers/components'
import { ProjectPageLatestItemsModelsFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import { useProjectPageItemViewType } from '~~/lib/projects/composables/layout'
import { canModifyModels } from '~~/lib/projects/helpers/permissions'
import { debounce } from 'lodash-es'
import { PlusIcon } from '@heroicons/vue/24/solid'
import { allProjectModelsRoute } from '~~/lib/common/helpers/route'

graphql(`
  fragment ProjectPageLatestItemsModels on Project {
    id
    role
    modelCount: models(limit: 0) {
      totalCount
    }
  }
`)

const props = defineProps<{
  project: ProjectPageLatestItemsModelsFragment
}>()

const queryLoading = ref(false)
const search = ref('')
const debouncedSearch = ref('')
const showNewDialog = ref(false)
const showLoadingBar = ref(false)
const title = ref('Models')

const gridOrList = useProjectPageItemViewType(title.value)

const canContribute = computed(() => canModifyModels(props.project))

const updateDebouncedSearch = debounce(() => {
  debouncedSearch.value = search.value.trim()
}, 500)

const updateSearchImmediately = (val?: string) => {
  updateDebouncedSearch.cancel()
  debouncedSearch.value = (val ?? search.value).trim()
}

watch(search, (newVal) => {
  if (newVal) showLoadingBar.value = true
  else showLoadingBar.value = false
})

watch(queryLoading, (newVal) => (showLoadingBar.value = newVal))
</script>
