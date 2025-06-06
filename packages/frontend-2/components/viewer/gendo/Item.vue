<template>
  <div v-if="detailedRender">
    <div class="relative">
      <div v-if="detailedRender.status === 'COMPLETED' && renderUrl" class="group">
        <button
          class="relative flex cursor-zoom-in w-full aspect-video"
          @click="openPreview"
        >
          <div
            class="absolute inset-0 bg-highlight-3 flex items-center justify-center rounded-lg"
          >
            <CommonLoadingIcon />
          </div>
          <NuxtImg
            :src="renderUrl"
            :alt="detailedRender.prompt"
            class="relative z-10 rounded-lg shadow aspect-video w-full object-cover"
          />
        </button>
        <div class="hidden group-hover:flex absolute top-2 left-2 gap-1 z-10">
          <div v-tippy="`Reset view`">
            <FormButton
              :icon-left="VideoCameraIcon"
              hide-text
              color="outline"
              size="sm"
              @click="setView()"
            >
              Reset View
            </FormButton>
          </div>
          <div v-tippy="`Copy prompt`">
            <FormButton
              :icon-left="ClipboardIcon"
              hide-text
              color="outline"
              size="sm"
              @click="copyPrompt"
            >
              Copy prompt
            </FormButton>
          </div>
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
        </div>
      </div>
      <div
        v-if="detailedRender.status !== 'COMPLETED'"
        class="relative w-full h-40 rounded-lg flex items-center justify-center"
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
        class="absolute bottom-0 left-0 gap-x-2 p-2 flex items-center min-w-0 max-w-full overflow-hidden z-10"
      >
        <div
          class="bg-foundation p-0.5 flex items-center gap-x-1 min-w-0 max-w-full rounded-md"
        >
          <UserAvatar :user="detailedRender.user" size="sm" />
          <div v-tippy="capitalizedPrompt" class="truncate select-none text-body-2xs">
            {{ capitalizedPrompt }}
          </div>
          <div v-tippy="`Reuse prompt`" class="shrink-0 h-6">
            <FormButton
              :icon-left="ArrowUturnUpIcon"
              hide-text
              color="subtle"
              size="sm"
              @click="reusePrompt"
            >
              Reuse prompt
            </FormButton>
          </div>
        </div>
      </div>
    </div>
    <ViewerGendoDialog
      v-model:open="isPreviewOpen"
      :render-url="renderUrl"
      :render-prompt="detailedRender.prompt"
    />
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
  ArrowUturnUpIcon,
  ClipboardIcon
} from '@heroicons/vue/24/outline'
import { useCameraUtilities } from '~/lib/viewer/composables/ui'
import { Vector3 } from 'three'
import { CommonLoadingIcon } from '@speckle/ui-components'
import { useMixpanel } from '~/lib/core/composables/mp'
import { upperFirst } from 'lodash-es'

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

const { copy } = useClipboard()
const { triggerNotification } = useGlobalToast()

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

const capitalizedPrompt = computed(() => {
  return upperFirst(detailedRender.value?.prompt)
})

const reusePrompt = () => {
  mixpanel.track('Gendo Prompt Reused', {
    renderId: detailedRender.value?.id,
    prompt: detailedRender.value?.prompt
  })
  emit('reuse-prompt', capitalizedPrompt.value || '')
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

const copyPrompt = async () => {
  await copy(capitalizedPrompt.value)
  triggerNotification({
    type: ToastNotificationType.Info,
    title: 'Prompt copied to clipboard'
  })
}
</script>
