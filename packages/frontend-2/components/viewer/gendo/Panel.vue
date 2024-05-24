<template>
  <ViewerLayoutPanel move-actions-to-bottom @close="$emit('close')">
    <template #title>
      AI Render by Gendo
      <span class="text-foreground-2">(Beta)</span>
    </template>
    <div class="p-1">
      <div class="space-y-2 flex flex-col mt-2">
        <FormTextArea
          v-model="prompt"
          name="prompt"
          label=""
          placeholder="Your prompt"
        />
        <div class="text-right">
          <FormButton :disabled="!prompt || isLoading" @click="enqueMagic()">
            Render
          </FormButton>
        </div>
      </div>
      <ViewerGendoList />
      <div class="p-2 text-xs text-foreground-2">
        TODO Empty state explaining this does
      </div>
    </div>
    <template #actions>
      <div class="text-right grow">
        <span class="text-foreground-2 text-sm">Learn more about</span>
        <CommonTextLink
          text
          link
          size="sm"
          class="ml-1"
          to="https://gendo.ai?utm=speckle"
          target="_blank"
        >
          Gendo
        </CommonTextLink>
      </div>
    </template>
  </ViewerLayoutPanel>
</template>
<script setup lang="ts">
import { useApolloClient } from '@vue/apollo-composable'
import { getFirstErrorMessage } from '~/lib/common/helpers/graphql'
import { requestGendoAIRender } from '~~/lib/gendo/graphql/queriesAndMutations'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'

const {
  projectId,
  resources: {
    response: { resourceItems }
  },
  ui: { camera },
  viewer: { instance: viewerInstance }
} = useInjectedViewerState()

defineEmits<{
  (e: 'close'): void
}>()

const prompt = ref<string>()
const isLoading = ref(false)

const enqueMagic = () => {
  isLoading.value = true
  viewerInstance.getRenderer().pipelineOptions = {
    ...viewerInstance.getRenderer().pipelineOptions,
    pipelineOutput: 1
  }

  viewerInstance.requestRender()
  setTimeout(async () => {
    const screenshot = await viewerInstance.screenshot()
    void lodgeRequest(screenshot)
    // Reset renderer back to normal
    viewerInstance.getRenderer().pipelineOptions = {
      ...viewerInstance.getRenderer().pipelineOptions,
      pipelineOutput: 8
    }
    viewerInstance.requestRender()
  }, 100)
}

const apollo = useApolloClient().client
const { triggerNotification } = useGlobalToast()

const lodgeRequest = async (screenshot: string) => {
  const modelId = resourceItems.value[0].modelId as string
  const versionId = resourceItems.value[0].versionId as string

  const res = await apollo
    .mutate({
      mutation: requestGendoAIRender,
      variables: {
        input: {
          projectId: projectId.value,
          modelId,
          versionId,
          camera: {
            position: camera.position.value,
            target: camera.target.value,
            isOrthoProjection: camera.isOrthoProjection.value
          },
          prompt: prompt.value || 'no prompt',
          baseImage: screenshot
        }
      }
    })
    .catch(convertThrowIntoFetchResult)

  if (!res.data) {
    const err = getFirstErrorMessage(res.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to enque Gendo render',
      description: err
    })
  } else {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Render successfully enqued'
    })
  }
  isLoading.value = false
}
</script>
