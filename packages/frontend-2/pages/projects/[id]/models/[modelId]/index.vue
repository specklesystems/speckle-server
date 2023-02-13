<template>
  <div class="absolute top-0 left-0 w-screen h-screen">
    <!-- Nav -->
    <Portal to="navigation">
      <ViewerScope :state="state">
        <HeaderNavLink
          :to="`/projects/${project?.id}`"
          :name="project?.name"
        ></HeaderNavLink>
        <!-- TODO: get name dynamically -->

        <!-- <HeaderNavLink :to="route.fullPath" :name="lastBreadcrumbName"></HeaderNavLink> -->
        <!-- {{ loadedObjects?.length }} ; {{ loadedModels?.length }} -->
        <ViewerExplorerNavbarLink />
      </ViewerScope>
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
import {
  useInjectedViewerLoadedResources,
  useSetupViewer
} from '~~/lib/viewer/composables/setup'

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

// const { modelsAndVersionIds: loadedModels, objects: loadedObjects } =
//   useInjectedViewerLoadedResources()

// const state = useInjectedViewerState()
// const loadedModels = computed(() => {
//   return state?.resources?.response.modelsAndVersionIds.value
// })
// const loadedObjects = computed(() => {
//   return state?.resources?.response.objects.value
// })

// const lastBreadcrumbName = computed(() => {
//   if (!loadedModels.value && !loadedObjects.value) return 'loading'
//   return 'test'
//   const totalLen = loadedModels.value.length + loadedObjects.value.length
//   const hasObjects = loadedObjects.value.length !== 0
//   const hasModels = loadedModels.value.length !== 0
//   const isMixed = hasObjects && hasModels
//   if (totalLen > 0) return `Multiple ${isMixed ? 'Resources' : 'Models'}`

//   if (hasObjects) return `Object ${loadedObjects.value[0].objectId.substring(0, 3)}...`
//   return loadedModels.value[0].model.name
// })
</script>
