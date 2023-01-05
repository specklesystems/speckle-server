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
        <FormButton :icon-left="PlusIcon">New</FormButton>
        <div class="w-60">
          <FormTextInput
            name="modelsearch"
            :show-label="false"
            placeholder="Search"
            class="bg-foundation shadow"
            @update:model-value="test"
          ></FormTextInput>
        </div>
        <div
          class="flex items-center justify-center rounded bg-foundation h-8 w-8 shadow"
        >
          <LayoutGridListToggle v-model="gridOrList" />
        </div>
      </div>
    </div>
    <div class="mb-14">
      <ProjectPageModelsStructuredView
        v-if="gridOrList === GridListToggleValue.List"
        :project="project"
      />
      <ProjectPageModelsCardView
        v-if="gridOrList === GridListToggleValue.Grid"
        :project="project"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ProjectPageModelsViewFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'
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

const viewTypeCookie = useSynchronizedCookie(`projectPage-models-viewType`)
const gridOrList = computed({
  get: () =>
    viewTypeCookie.value === GridListToggleValue.List
      ? GridListToggleValue.List
      : GridListToggleValue.Grid,
  set: (newVal) => (viewTypeCookie.value = newVal)
})

function test(e: unknown) {
  console.log(e)
}
</script>
