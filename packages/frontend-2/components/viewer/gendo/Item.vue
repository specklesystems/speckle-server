<template>
  <div v-if="detailedRender">
    <div class="relative">
      <div v-if="detailedRender.status === 'COMPLETED' && renderUrl" class="group">
        <button @click="isDialogOpen = true">
          <img :src="renderUrl" alt="render" class="rounded-lg shadow" />
        </button>
        <div class="absolute top-2 left-2 flex gap-2">
          <!-- eslint-disable-next-line vuejs-accessibility/anchor-has-content -->
          <a
            v-tippy="'Download'"
            class="bg-foundation p-1 rounded"
            :href="renderUrl"
            target="_blank"
            title="download image"
          >
            <ArrowDownTrayIcon class="w-4" />
          </a>
          <button
            v-if="detailedRender.camera"
            v-tippy="'Set view'"
            class="bg-foundation p-1 rounded"
            @click="setView()"
          >
            <VideoCameraIcon class="w-4" />
          </button>
        </div>
      </div>
      <div
        v-if="detailedRender.status !== 'COMPLETED'"
        class="relative w-full h-32 rounded-lg flex items-center justify-center"
      >
        <div
          :class="`absolute rounded-lg w-full h-full top-0 ${
            detailedRender.status === 'IN_QUEUE' ? 'bg-blue-500/10' : 'bg-red-500/10'
          }`"
        ></div>
        <CommonLoadingIcon v-if="detailedRender.status === 'IN_QUEUE'" size="sm" />
        <ExclamationCircleIcon v-else class="w-6 text-danger" />
      </div>
      <div
        class="absolute bottom-2 left-2 text-body-xs space-x-2 flex items-center min-w-0 max-w-full overflow-hidden"
      >
        <div
          class="bg-foundation p-0.5 flex items-center space-x-1 min-w-0 max-w-full rounded-md"
        >
          <UserAvatar :user="detailedRender.user" size="sm" />
          <span class="truncate max-w-full select-none">
            {{ detailedRender.prompt }}
          </span>
        </div>
      </div>
    </div>
    <LayoutDialog v-model:open="isDialogOpen" max-width="xl" :buttons="dialogButtons">
      <template #header>
        <div class="flex items-center gap-2">
          <UserAvatar :user="detailedRender?.user" size="sm" />
          <span class="text-body-sm text-foreground">{{ detailedRender?.prompt }}</span>
        </div>
      </template>
      <div class="flex justify-center">
        <NuxtImg
          :src="renderUrl || undefined"
          alt="render preview"
          class="max-w-full max-h-[80vh] object-contain"
        />
      </div>
      <div class="mt-4 flex items-center gap-4">
        <UserAvatar :user="detailedRender?.user" size="sm" />
        <span class="text-body-sm text-foreground">{{ detailedRender?.prompt }}</span>
      </div>
    </LayoutDialog>
  </div>
  <div v-else />
</template>
<script setup lang="ts">
import { useQuery, useSubscription } from '@vue/apollo-composable'
import type { GendoAiRender } from '~/lib/common/generated/gql/graphql'
import {
  getGendoAIRender,
  onGendoAiRenderUpdated
} from '~/lib/gendo/graphql/queriesAndMutations'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import {
  VideoCameraIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'
import { useCameraUtilities } from '~/lib/viewer/composables/ui'
import { Vector3 } from 'three'

const props = defineProps<{
  renderRequest: GendoAiRender
}>()

const {
  projectId,
  resources: {
    response: { resourceItems }
  }
} = useInjectedViewerState()

const isDialogOpen = ref(false)

const versionId = computed(() => {
  return resourceItems.value[0].versionId as string
})

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Download',
    props: {
      color: 'outline',
      as: 'a',
      href: renderUrl.value || undefined,
      target: '_blank'
    },
    icon: ArrowDownTrayIcon,
    show: !!renderUrl.value
  },
  {
    text: 'Set View',
    props: { color: 'outline' },
    icon: VideoCameraIcon,
    onClick: setView,
    show: !!detailedRender.value?.camera
  }
])

const { result, refetch } = useQuery(getGendoAIRender, () => ({
  projectId: projectId.value,
  versionId: versionId.value,
  gendoAiRenderId: props.renderRequest.id
}))

const { onResult: onRenderUpdated } = useSubscription(onGendoAiRenderUpdated, () => ({
  id: projectId.value,
  versionId: versionId.value
}))

onRenderUpdated(() => {
  refetch()
})

const detailedRender = computed(() => result.value?.project?.version?.gendoAIRender)

const { setView: setViewInternal } = useCameraUtilities()

const apiOrigin = useApiOrigin()
const renderUrl = computed(() => {
  if (detailedRender.value?.status !== 'COMPLETED') return null
  const url = new URL(
    `/api/stream/${projectId.value}/blob/${detailedRender.value?.responseImage}`,
    apiOrigin
  )
  return url.toString()
})

const setView = () => {
  const cam = detailedRender.value?.camera as { target: Vector3; position: Vector3 }

  setViewInternal(
    {
      target: new Vector3(cam.target.x, cam.target.y, cam.target.z),
      position: new Vector3(cam.position.x, cam.position.y, cam.position.z)
    },
    true
  )
}
</script>
