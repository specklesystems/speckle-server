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
          <div v-if="limits" class="text-xs text-foreground-2">
            You have used {{ limits.used }} out of {{ limits.limit }} monthly free
            renders.
          </div>
          <FormButton
            v-if="(limits?.used || 1) < (limits?.limit || 0)"
            :disabled="
              !prompt ||
              isLoading ||
              timeOutWait ||
              (limits?.used || 0) >= (limits?.limit || 0)
            "
            @click="enqueMagic()"
          >
            Render
          </FormButton>
          <FormButton v-else to="https://gendo.ai?utm=speckle" target="_blank">
            Visit Gendo
          </FormButton>
        </div>
      </div>
      <ViewerGendoList />
    </div>
    <template #actions>
      <div class="flex grow items-center justify-between">
        <span class="text-foreground-2 text-sm">
          <CommonTextLink
            text
            link
            class="mr-2"
            to="https://www.gendo.ai/terms-of-service"
            target="_blank"
          >
            Terms and conditions
          </CommonTextLink>
        </span>
        <div>
          <span class="text-foreground-2 text-sm">More about</span>
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
      </div>
    </template>
  </ViewerLayoutPanel>
</template>
<script setup lang="ts">
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { useTimeoutFn } from '@vueuse/core'
import { getFirstErrorMessage } from '~/lib/common/helpers/graphql'
import { PassReader } from '~/lib/viewer/extensions/PassReader'
import {
  requestGendoAIRender,
  activeUserGendoLimits
} from '~~/lib/gendo/graphql/queriesAndMutations'
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

const { result, refetch } = useQuery(activeUserGendoLimits)

const limits = computed(() => {
  return result?.value?.activeUser?.gendoAICredits
})

const enqueMagic = async () => {
  isLoading.value = true
  const [depthData, width, height] = await viewerInstance
    .getExtension(PassReader)
    .read('DEPTH')
  const screenshot = PassReader.toBase64(
    PassReader.decodeDepth(depthData),
    width,
    height
  )
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
  refetch()
}
</script>
