<template>
  <div>
    <div
      class="flex flex-col space-y-2 justify-between mb-4 lg:flex-row lg:space-y-0 lg:space-x-2"
    >
      <div class="flex items-center space-x-2 flex-grow">
        <h2 class="h4 font-bold">Models</h2>
        <FormButton size="sm" rounded>New</FormButton>
      </div>
      <div class="flex items-center space-x-2">
        <div
          class="flex items-center justify-center rounded-xl bg-foundation h-12 w-12 shadow mt-1"
        >
          <LayoutGridListToggle v-model="gridOrList" />
        </div>
        <div class="w-60">
          <FormTextInput
            name="modelsearch"
            :show-label="false"
            placeholder="Search"
            class="bg-foundation shadow"
            @update:model-value="test"
          ></FormTextInput>
        </div>
      </div>
    </div>
    <div class="mb-14">
      <div v-if="modelsWithMainEscaped.length">
        <!-- <ClientOnly> -->
        <ProjectPageModelsStructuredView
          v-if="gridOrList === GridListToggleValue.List"
          :project="project"
          :model-tree="modelsWithMainEscaped"
        />
        <ProjectPageModelsCardView
          v-if="gridOrList === GridListToggleValue.Grid"
          :project="project"
          :models="flattenedTree"
        />
        <!-- </ClientOnly> -->
      </div>
      <div v-else>TODO: Empty state</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ProjectPageLatestItemsModelsFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import { structuredModelsQuery } from '~~/lib/projects/graphql/queries'
import { StructuredModel, Model } from '~~/lib/common/generated/gql/graphql'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'

const props = defineProps<{
  project: ProjectPageLatestItemsModelsFragment
}>()

graphql(`
  fragment ModelFragment on Model {
    id
    name
    versionCount
    commentThreadCount
    previewUrl
    updatedAt
  }
`)

graphql(`
  fragment StructuredModelFragment on StructuredModel {
    name
    model {
      ...ModelFragment
    }
  }
`)

const { result: structuredModelsResult } = useQuery(structuredModelsQuery, () => ({
  projectId: props.project.id
}))

const models = computed(() => {
  return (
    structuredModelsResult.value?.project?.structuredModels?.structure?.children || []
  )
})

function test(e: unknown) {
  console.log(e)
}

const modelsWithMainEscaped = computed(() => {
  return (
    (models.value.filter((m) => {
      if (
        m?.name === 'main' &&
        m?.model?.versionCount === 0 &&
        m?.children?.length === 0
      )
        return false
      return true
    }) as StructuredModel[]) || []
  )
})

const flattenedTree = computed(() => {
  const all = [] as Model[]

  for (const item of modelsWithMainEscaped.value) {
    flatten(item)
  }

  function flatten(item: StructuredModel) {
    if (item.model) all.push(item.model)
    for (const subItem of item.children as StructuredModel[]) {
      if (subItem?.model) all.push(subItem?.model)
      for (const child of subItem?.children as StructuredModel[]) {
        flatten(child)
      }
    }
  }

  return all
})

const viewTypeCookie = useSynchronizedCookie(`projectPage-models-viewType`)
const gridOrList = computed({
  get: () =>
    viewTypeCookie.value === GridListToggleValue.List
      ? GridListToggleValue.List
      : GridListToggleValue.Grid,
  set: (newVal) => (viewTypeCookie.value = newVal)
})
</script>
