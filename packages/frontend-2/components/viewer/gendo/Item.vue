<template>
  <div v-if="detailedRender">
    <div class="relative">
      <div v-if="detailedRender.status === 'COMPLETED' && renderUrl" class="group">
        <button class="relative flex cursor-zoom-in h-32 w-full" @click="openPreview">
          <div class="bg-highlight-3 flex items-center justify-center">
            <CommonLoadingIcon />
          </div>
          <NuxtImg
            :src="renderUrl"
            :alt="detailedRender.prompt"
            class="absolute inset-0 rounded-lg shadow h-32 w-full object-cover"
          />
        </button>
        <div class="hidden group-hover:flex absolute top-2 left-2 gap-1">
          <div v-tippy="`Download`">
            <FormButton
              :to="renderUrl"
              external
              target="_blank"
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
        class="absolute bottom-2 left-2 space-x-2 flex items-center min-w-0 max-w-full overflow-hidden"
      >
        <div
          class="group bg-foundation p-0.5 flex items-center space-x-1 min-w-0 max-w-full rounded-md"
        >
          <UserAvatar :user="detailedRender.user" size="sm" />
          <span class="truncate max-w-full select-none pr-1 max-w-40 text-body-2xs">
            {{ detailedRender.prompt }}
          </span>
          <FormButton
            hide-text
            :icon-left="ArrowUpIcon"
            color="subtle"
            size="sm"
            class="hidden group-hover:block"
            @click="reusePrompt"
          >
            Reuse prompt
          </FormButton>
        </div>
      </div>
    </div>
    <ViewerGendoDialog v-model:open="isPreviewOpen" :render-url="renderUrl" />
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
  ArrowUpIcon
} from '@heroicons/vue/24/outline'
import { useCameraUtilities } from '~/lib/viewer/composables/ui'
import { Vector3 } from 'three'
import { CommonLoadingIcon } from '@speckle/ui-components'
import { useMixpanel } from '~/lib/core/composables/mp'

const props = defineProps<{
  renderRequest: GendoAiRender
}>()

const emit = defineEmits<{
  (e: 'reuse-prompt', prompt: string): void
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

const { setView: setViewInternal } = useCameraUtilities()
const mixpanel = useMixpanel()
const apiOrigin = useApiOrigin()

const detailedRender = computed(() => result.value?.project?.version?.gendoAIRender)

const renderUrl = computed(() => {
  if (detailedRender.value?.status !== 'COMPLETED') return undefined
  const url = new URL(
    `/api/stream/${projectId.value}/blob/${detailedRender.value?.responseImage}`,
    apiOrigin
  )
  return url.toString()
})

const reusePrompt = () => {
  mixpanel.track('Gendo Prompt Reused', {
    renderId: detailedRender.value?.id,
    prompt: detailedRender.value?.prompt
  })
  emit('reuse-prompt', detailedRender.value?.prompt || '')
}

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

const openPreview = () => {
  mixpanel.track('Gendo Render Preview Opened', {
    renderId: detailedRender.value?.id,
    prompt: detailedRender.value?.prompt
  })
  isPreviewOpen.value = true
}
</script>
