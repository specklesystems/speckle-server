<template>
  <ViewerLayoutPanel move-actions-to-bottom @close="$emit('close')">
    <template #title>
      <div class="flex gap-1 items-center">
        <span class="text-foreground border-b border-transparent">AI Render by</span>
        <NuxtLink
          class="flex gap-1 items-center border-b border-outline-3 hover:border-outline-5 pb-px leading-none mt-0.5"
          to="https://gendo.ai?utm=speckle"
          target="_blank"
        >
          Gendo
        </NuxtLink>
        <CommonBadge color-classes="bg-highlight-3 text-foreground-2 scale-90">
          BETA
        </CommonBadge>
      </div>
    </template>
    <div class="py-2 px-3 flex flex-col gap-2">
      <CommonAlert v-if="!limits" color="danger">
        <template #title>No credits available</template>
      </CommonAlert>
      <CommonAlert
        v-else-if="isNearingLimit || isOutOfCredits"
        :color="alertColor"
        size="xs"
      >
        <template #title>
          {{ limits.used }}/{{ limits.limit }} free renders used this month
        </template>
      </CommonAlert>
      <div class="flex flex-col gap-y-2">
        <FormTextArea
          v-model="prompt"
          name="prompt"
          size="lg"
          :placeholder="randomPlaceholder"
          color="foundation"
          :disabled="isLoading || timeOutWait || isOutOfCredits"
          textarea-classes="sm:!min-h-24"
        />
        <div class="flex justify-between gap-2 items-center text-foreground-2">
          <FormButton
            color="outline"
            size="sm"
            external
            to="https://www.gendo.ai/terms-of-service"
            target="_blank"
          >
            <div class="flex items-center gap-1 text-foreground-2 font-normal">
              <span class="text-body-2xs font-semibold text-foreground">Forum:</span>
              <span>Writing prompts</span>
              <ArrowTopRightOnSquareIcon class="h-3 w-3" />
            </div>
          </FormButton>

          <FormButton
            :disabled="!prompt || isLoading || timeOutWait || isOutOfCredits"
            @click="enqueMagic()"
          >
            Render
          </FormButton>
        </div>
      </div>
      <ViewerGendoList />
    </div>
    <template #actions>
      <div class="flex w-full items-center justify-end">
        <span
          v-if="limits && !isOutOfCredits && !isNearingLimit"
          class="text-body-2xs text-right"
        >
          {{ limits.used }}/{{ limits.limit }} free renders used this month
        </span>
        <FormButton
          color="subtle"
          size="sm"
          external
          to="https://www.gendo.ai/terms-of-service"
          target="_blank"
        >
          <div class="flex items-center gap-1 text-foreground-2 font-normal">
            <span>Terms</span>
            <ArrowTopRightOnSquareIcon class="h-3 w-3" />
          </div>
        </FormButton>
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
import { useMixpanel } from '~/lib/core/composables/mp'
import { CommonAlert, CommonBadge } from '@speckle/ui-components'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'

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

const suggestedPrompts = ref<string[]>([
  'Example: Minimalist Scandinavian interior with warm natural lighting',
  'Luxury penthouse with floor-to-ceiling windows and city views',
  'Cozy industrial loft with exposed brick and steel elements',
  'Modern office space with biophilic design elements',
  'High-end retail space with dramatic lighting'
])

const { result, refetch } = useQuery(activeUserGendoLimits)

const limits = computed(() => {
  return result?.value?.activeUser?.gendoAICredits
})

const randomPlaceholder = computed(() => {
  const randomIndex = Math.floor(Math.random() * suggestedPrompts.value.length)
  return suggestedPrompts.value[randomIndex]
})

const isOutOfCredits = computed(() => {
  return (limits.value?.used || 0) >= (limits.value?.limit || 0)
})

const isNearingLimit = computed(() => {
  if (!limits.value) return
  const usagePercent = (limits.value?.used / limits.value?.limit) * 100
  return usagePercent >= 80
})

const alertColor = computed(() => {
  if (isOutOfCredits.value) return 'danger'
  if (isNearingLimit.value) return 'warning'
  return 'neutral'
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

const mixpanel = useMixpanel()

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

  mixpanel.track('Gendo Render Triggered', {
    status: res.data ? 'Success' : 'Error',
    prompt: prompt.value,
    remainingRenders: (limits.value?.limit || 0) - (limits.value?.used || 0)
  })

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
