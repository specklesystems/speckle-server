<template>
  <div class="absolute top-0 left-0 w-screen h-screen">
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

    <ClientOnly>
      <!-- Viewer host -->
      <div class="special-gradient absolute w-screen h-screen">
        <ViewerBase />
      </div>

      <!-- Global loading bar -->
      <ViewerLoadingBar />

      <!-- Sidebar sketches -->
      <ViewerControlsOption3 />

      <!-- Viewer Object Selection Info Display -->
      <ViewerSelectionSidebar />
    </ClientOnly>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useSetupViewer } from '~~/lib/viewer/composables/setup'

definePageMeta({
  layout: 'viewer',
  middleware: ['require-valid-project'],
  pageTransition: false, // NOTE: transitions fuck viewer up
  layoutTransition: false,
  key: '/projects/:id/models/resources' // To prevent controls flickering on resource url param changes
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)

const {
  resources: {
    response: { project }
  }
} = useSetupViewer({
  projectId
})

graphql(`
  fragment ModelPageProject on Project {
    id
    createdAt
    name
  }
`)
</script>
