<template>
  <div v-if="detailedRender">
    <div class="relative">
      <div v-if="detailedRender.status === 'COMPLETED' && renderUrl" class="group">
        <button class="relative flex cursor-zoom-in h-32" @click="isPreviewOpen = true">
          <div class="bg-highlight-3 flex items-center justify-center">
            <CommonLoadingIcon />
          </div>
          <NuxtImg
            :src="renderUrl"
            :alt="detailedRender.prompt"
            class="absolute inset-0 rounded-lg shadow h-32 object-cover"
          />
        </button>
        <div class="hidden group-hover:flex absolute top-2 left-2 gap-1">
          <div v-tippy="`Download`">
            <FormButton
              :to="renderUrl"
              download
              :icon-left="ArrowDownTrayIcon"
              hide-text
              color="outline"
              size="sm"
            >
              Download
            </FormButton>
          </div>
          <div v-tippy="`Set view`">
            <FormButton
              :icon-left="VideoCameraIcon"
              hide-text
              color="outline"
              size="sm"
              @click="setView()"
            >
              Set View
            </FormButton>
          </div>
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
          <span class="truncate max-w-full select-none pr-1">
            {{ detailedRender.prompt }}
          </span>
        </div>
      </div>
    </div>
    <div
      v-if="isPreviewOpen"
      class="absolute z-50 inset-0 flex items-center justify-center"
    >
      <button
        class="absolute inset-0 backdrop-blur-xs bg-black/60 dark:bg-neutral-900/60"
        @click="isPreviewOpen = false"
      />
      <div class="relative z-10 flex flex-col items-center justify-center">
        <NuxtImg
          :src="renderUrl || undefined"
          alt="render preview"
          class="w-full h-full max-h-[80vh] max-w-[80vw] object-contain"
        />
        <FormButton
          :icon-left="XMarkIcon"
          color="outline"
          @click="isPreviewOpen = false"
        >
          Close
        </FormButton>
      </div>
    </div>
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
  ArrowDownTrayIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { useCameraUtilities } from '~/lib/viewer/composables/ui'
import { Vector3 } from 'three'
import { CommonLoadingIcon } from '@speckle/ui-components'

const props = defineProps<{
  renderRequest: GendoAiRender
}>()

const {
  projectId,
  resources: {
    response: { resourceItems }
  }
} = useInjectedViewerState()

const isPreviewOpen = ref(false)

const versionId = computed(() => {
  return resourceItems.value[0].versionId as string
})

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
