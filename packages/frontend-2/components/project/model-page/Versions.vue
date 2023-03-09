<template>
  <div>
    <h1 class="block h4 font-bold mb-8">Versions</h1>
    <div
      v-if="items?.length && project.model"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
    >
      <!-- Decrementing z-index necessary for the actions menu to render correctly. Each card has its own stacking context because of the scale property -->
      <ProjectModelPageVersionsCard
        v-for="(item, i) in items"
        :key="item.id"
        :version="item"
        :model-id="project.model.id"
        :project-id="project.id"
        :style="`z-index: ${items.length - i};`"
      />
    </div>
    <div v-else>TODO: Versions Empty state</div>
    <InfiniteLoading :allow-retry="true" @infinite="infiniteLoad" />
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectModelPageVersionsProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { InfiniteLoaderState } from '~~/lib/global/helpers/components'

graphql(`
  fragment ProjectModelPageVersionsProject on Project {
    id
    model(id: $modelId) {
      id
      versions(limit: 16, cursor: $versionsCursor) {
        totalCount
        items {
          ...ProjectModelPageVersionsCardVersion
        }
      }
    }
  }
`)

const props = defineProps<{
  project: ProjectModelPageVersionsProjectFragment
}>()

const items = computed(() => props.project.model?.versions.items)

const infiniteLoad = (state: InfiniteLoaderState) => {
  console.log(state)
  state.complete()
}
</script>
