<template>
  <ViewerLayoutPanel move-actions-to-bottom @close="$emit('close')">
    <template #title>
      <span class="text-foreground">AI Render by</span>
      <CommonTextLink
        text
        link
        class="ml-1"
        to="https://gendo.ai?utm=speckle"
        target="_blank"
      >
        Gendo
      </CommonTextLink>
      <span class="text-foreground-2">&nbsp;(Beta)</span>
    </template>
    <div class="p-2">
      <div class="space-y-2 flex flex-col mt-2">
        <FormTextArea
          v-model="prompt"
          name="prompt"
          label=""
          size="lg"
          placeholder="Your prompt"
        />
        <div class="flex justify-end space-x-2 items-center">
          <FormButton
            :disabled="!prompt || isLoading || timeOutWait"
            @click="enqueMagic()"
          >
            Render
          </FormButton>
        </div>
      </div>
      <ViewerGendoList />
    </div>
    <template #actions>
      <div class="text-right grow">
        <span class="text-foreground-2 text-sm">Learn more about</span>
        <CommonTextLink
          text
          link
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
import { useTimeoutFn } from '@vueuse/core'
import { getFirstErrorMessage } from '~/lib/common/helpers/graphql'
import { PassReader } from '~/lib/viewer/extensions/PassReader'
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
const timeOutWait = ref(false)

const enqueMagic = async () => {
  isLoading.value = true
  const screenshot = await viewerInstance.getExtension(PassReader).read()
  void lodgeRequest(screenshot)

  timeOutWait.value = true

  useTimeoutFn(() => {
    timeOutWait.value = false
  }, 5000)
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
          prompt: prompt.value?.toLowerCase() || 'no prompt',
          baseImage: screenshot
        }
      }
    })
    .catch(convertThrowIntoFetchResult)

  if (!res.data) {
    const err = getFirstErrorMessage(res.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to enqueue Gendo render',
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
