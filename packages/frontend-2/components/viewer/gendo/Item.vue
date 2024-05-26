<template>
  <div v-if="detailedRender">
    <div class="relative">
      <img
        v-if="detailedRender.status === 'COMPLETED'"
        :src="`data:image/png;base64,${detailedRender.responseImage}`"
        alt="render"
        class="rounded-lg shadow"
      />
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
        class="absolute bottom-2 left-2 text-sm rounded-md pr-4 space-x-2 flex items-center min-w-0 max-w-full overflow-hidden"
      >
        <div
          class="bg-foundation p-2 flex items-center space-x-2 min-w-0 max-w-full rounded-md"
        >
          <UserAvatar :user="detailedRender.user" size="sm" />
          <button
            v-if="detailedRender.camera"
            v-tippy="'Set view'"
            class="mt-[2px] hover:text-blue-500 transition"
            @click="setView()"
          >
            <VideoCameraIcon class="w-4" />
          </button>
          <span class="truncate max-w-full">{{ detailedRender.prompt }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery, useSubscription } from '@vue/apollo-composable'
import dayjs from 'dayjs'
import type { GendoAiRender } from '~/lib/common/generated/gql/graphql'
import {
  getGendoAIRender,
  onGendoAiRenderUpdated
} from '~/lib/gendo/graphql/queriesAndMutations'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { VideoCameraIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import { useCameraUtilities } from '~/lib/viewer/composables/ui'

const props = defineProps<{
  renderRequest: GendoAiRender
}>()

const {
  projectId,
  resources: {
    response: { resourceItems }
  },
  viewer: { instance: viewerInstance }
} = useInjectedViewerState()

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

const dateDiff = computed(() => {
  if (!detailedRender.value) return undefined
  const d1 = dayjs(detailedRender.value?.createdAt)
  const d2 = dayjs(detailedRender.value?.updatedAt)
  const diff = d2.from(d1, true)
  return diff
})

const { setView: setViewInternal } = useCameraUtilities()

const setView = () => {
  setViewInternal(
    {
      target: detailedRender.value?.camera?.target,
      position: detailedRender.value?.camera.position
    },
    true
  )
}
</script>
