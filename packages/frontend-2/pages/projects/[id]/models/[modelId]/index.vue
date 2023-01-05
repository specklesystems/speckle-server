<template>
  <div class="absolute top-0 left-0 w-screen h-screen">
    <!-- Viewer host element -->
    <div
      id="rendererparentddd"
      ref="rendererparent"
      class="absolute w-full h-full"
    ></div>

    <!-- Nav -->
    <Portal to="navigation">
      <HeaderNavLink
        :to="`/projects/${project?.id}`"
        :name="project?.name"
      ></HeaderNavLink>
      <HeaderNavLink
        :to="route.fullPath"
        name="Model Name/Multiple Models"
      ></HeaderNavLink>
    </Portal>

    <!-- Global loading bar -->
    <ViewerLoadingBar />

    <!-- Sidebar sketches -->
    <div
      class="absolute bg-orange-500/0 h-screen max-h-screen pt-[4.5rem] px-4 flex space-x-4"
    >
      <div class="flex flex-col space-y-2 h-full">
        <button
          class="bg-foundation shadow-md rounded-full w-12 h-12 flex items-center justify-center"
          @click="showSidebar = !showSidebar"
        >
          <CubeIcon class="w-5 h-5" />
        </button>
        <div
          class="bg-foundation shadow-md rounded-full w-12 h-12 flex items-center justify-center"
        >
          <Square3Stack3DIcon class="w-5 h-5" />
        </div>
        <div
          class="bg-foundation shadow-md rounded-full w-12 h-12 flex items-center justify-center"
        >
          <ChatBubbleOvalLeftIcon class="w-5 h-5" />
        </div>
        <div
          class="bg-foundation rounded-full w-10 py-4 flex items-center justify-center shadow-md"
        >
          +
          <br />
          x
          <br />
          ~
          <br />
          ±
        </div>
      </div>
      <div
        :class="`bg-foundation mb-4 rounded-md shadow-md transition-[width,opacity] ease-in-out duration-75 overflow-hidden ${
          showSidebar ? 'w-96 opacity-100' : 'w-0 opacity-0'
        }`"
      >
        <ViewerResourcesList />
        <!-- <ViewerResourcesExplorer /> -->
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'
import { modelPageProjectQuery } from '~~/lib/projects/graphql/queries'
import {
  ChatBubbleLeftIcon,
  ChatBubbleOvalLeftIcon,
  CubeIcon,
  Square3Stack3DIcon
} from '@heroicons/vue/24/outline'
import { Viewer } from '@speckle/viewer'
import { ViewerModelResource, parseUrlParameters } from '~~/lib/viewer/helpers'

import { setupViewer } from '~~/lib/viewer/composables/viewer'

const route = useRoute()
const resources = ref(parseUrlParameters(route.params.modelId as string))

const updateResourceVersion = (resourceId: string, resourceVersion: string) => {
  //TODO
  const resource = resources.value.find(
    (r) => (r as ViewerModelResource).modelId === resourceId
  ) as ViewerModelResource
  resource.versionId = resourceVersion
}

provide('resources', { resources, updateResourceVersion })

const rendererparent = ref<HTMLElement>()

const showSidebar = ref(true)

let viewer: Viewer, container: HTMLElement, isInitializedPromise: Promise<boolean>

if (process.client) {
  const { viewer: v, container: c, isInitializedPromise: p } = setupViewer()
  viewer = v
  container = c
  isInitializedPromise = p
  provide('viewer', viewer)
}

onMounted(async () => {
  if (process.client) {
    await isInitializedPromise
    container.style.display = 'block'
    rendererparent.value?.appendChild(container)

    viewer.resize()
    viewer.cameraHandler.onWindowResize()
  }
})

onBeforeUnmount(async () => {
  await viewer.unloadAll()
  container.style.display = 'none'
  document.body.appendChild(container)
})

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
  pageTransition: false, // NOTE: fucks viewer up
  layoutTransition: false
})
</script>
<style scoped>
.test {
  display: block;
}
</style>
