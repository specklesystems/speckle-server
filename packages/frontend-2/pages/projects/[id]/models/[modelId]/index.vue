<template>
  <div class="absolute top-0 left-0 w-screen h-screen">
    <!-- Viewer host -->
    <div class="special-gradient absolute w-screen h-screen">
      <ViewerBase />
    </div>

    <!-- Nav -->
    <Portal to="navigation">
      <HeaderNavLink
        :to="`/projects/${project?.id}`"
        :name="project?.name"
      ></HeaderNavLink>
      <!-- TODO: get name dynamically -->
      <HeaderNavLink
        :to="route.fullPath"
        name="Model Name/Multiple Models"
      ></HeaderNavLink>
    </Portal>

    <!-- Global loading bar -->
    <ViewerLoadingBar />

    <!-- Sidebar sketches -->
    <ViewerControlsOption3 />
    <!-- <ViewerControlsOption2 /> -->
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'
import { modelPageProjectQuery } from '~~/lib/projects/graphql/queries'

import { ViewerModelResource, parseUrlParameters } from '~~/lib/viewer/helpers'

import { setupViewer } from '~~/lib/viewer/composables/viewer'

if (process.client) {
  setupViewer()
}

const route = useRoute()
const resources = ref(parseUrlParameters(route.params.modelId as string))

const updateResourceVersion = (resourceId: string, resourceVersion: string) => {
  const resource = resources.value.find(
    (r) => (r as ViewerModelResource).modelId === resourceId
  ) as ViewerModelResource
  resource.versionId = resourceVersion
}

provide('resources', { resources, updateResourceVersion })

graphql(`
  fragment ModelPageProject on Project {
    id
    createdAt
    name
  }
`)

const { result } = useQuery(modelPageProjectQuery, () => ({
  id: route.params.id as string
}))
const project = computed(() => result.value?.project)

definePageMeta({
  middleware: ['require-valid-project'],
  pageTransition: false, // NOTE: transitions fuck viewer up
  layoutTransition: false
})
</script>
<style scoped>
.test {
  display: block;
}
</style>
