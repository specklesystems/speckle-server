<template>
  <div class="absolute top-0 left-0 w-screen h-screen">
    <!-- Nav -->
    <Portal to="navigation">
      <ViewerScope :state="state">
        <HeaderNavLink
          :to="`/projects/${project?.id}`"
          :name="project?.name"
        ></HeaderNavLink>
        <ViewerExplorerNavbarLink />
      </ViewerScope>
    </Portal>

    <Portal to="primary-actions">
      <div class="flex space-x-4">
        <FormButton :icon-left="ShareIcon">Share</FormButton>
      </div>
    </Portal>

    <ClientOnly>
      <!-- Viewer host -->
      <div class="special-gradient absolute w-screen h-screen z-10">
        <ViewerBase />
        <ViewerAnchoredPoints />
      </div>

      <!-- Global loading bar -->
      <ViewerLoadingBar class="z-20" />

      <!-- Sidebar sketches -->
      <ViewerControlsOption3 class="z-20" />

      <!-- Viewer Object Selection Info Display -->
      <ViewerSelectionSidebar class="z-20" />

      <!-- Shows up when filters are applied for an easy return to normality -->
      <ViewerGlobalFilterReset class="z-20" />
    </ClientOnly>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useSetupViewer } from '~~/lib/viewer/composables/setup'
import { ShareIcon } from '@heroicons/vue/20/solid'

definePageMeta({
  layout: 'viewer',
  middleware: ['require-valid-project'],
  pageTransition: false, // NOTE: transitions fuck viewer up
  layoutTransition: false,
  key: '/projects/:id/models/resources' // To prevent controls flickering on resource url param changes
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)

const state = useSetupViewer({
  projectId
})

const {
  resources: {
    response: { project }
  }
} = state

graphql(`
  fragment ModelPageProject on Project {
    id
    createdAt
    name
  }
`)
</script>
