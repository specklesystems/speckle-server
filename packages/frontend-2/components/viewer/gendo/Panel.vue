<template>
  <ViewerLayoutPanel @close="$emit('close')">
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
    <div class="pt-3">
      <div class="px-3 flex flex-col gap-y-3">
        <CommonAlert v-if="!limits" color="danger" size="xs">
          <template #title>No credits available</template>
          <template #description>
            <div class="leading-snug">
              AI Renders are only available on
              <NuxtLink
                class="border-b border-outline-3 hover:border-outline-5 pb-px leading-none"
                external
                to="https://app.speckle.systems"
                target="_blank"
              >
                app.speckle.systems
              </NuxtLink>
            </div>
          </template>
        </CommonAlert>
        <CommonAlert v-else-if="!activeUser" color="danger" size="xs">
          <template #title>Sign in required</template>
          <template #description>
            <div class="leading-snug">Please sign in to generate AI renders</div>
          </template>
        </CommonAlert>
        <CommonAlert v-else-if="isOutOfCredits" color="neutral" size="xs">
          <template #title>Credits reset on {{ formattedResetDate }}</template>
        </CommonAlert>
        <div class="flex flex-col gap-y-3">
          <FormTextArea
            v-model="prompt"
            name="prompt"
            size="lg"
            :placeholder="randomPlaceholder"
            color="foundation"
            :disabled="isLoading || timeOutWait || isOutOfCredits"
            textarea-classes="sm:!min-h-24"
            @keypress.enter.prevent="
              !isLoading && !timeOutWait && !isOutOfCredits && prompt && enqueMagic()
            "
          />
          <div class="flex justify-between gap-2 items-center text-foreground-2">
            <FormButton
              color="outline"
              size="sm"
              external
              to="https://speckle.community/t/say-hello-to-ai-renders-in-speckle/15913"
              target="_blank"
            >
              <div class="flex items-center gap-1 text-foreground-2 font-normal">
                <span>Learn to prompt</span>
                <ArrowTopRightOnSquareIcon class="h-3 w-3" />
              </div>
            </FormButton>

            <div
              :key="`gendo-credits-${isOutOfCredits}`"
              v-tippy="
                !limits
                  ? 'No credits available'
                  : isOutOfCredits
                  ? 'No credits remaining'
                  : undefined
              "
            >
              <FormButton
                :disabled="!prompt || isLoading || timeOutWait || isOutOfCredits"
                @click="enqueMagic()"
              >
                Generate
              </FormButton>
            </div>
          </div>
        </div>
        <ViewerGendoList v-if="isGendoPanelEnabled" @reuse-prompt="prompt = $event" />
        <!-- Empty div to maintain flex gapping -->
        <div v-else />
      </div>
      <div
        class="flex w-full items-center justify-between gap-2 border-t border-outline-2 py-1 px-1"
      >
        <FormButton color="subtle" size="sm" @click="isFeedbackOpen = true">
          <div class="flex items-center gap-1 text-foreground-2 font-normal">
            <span>Give us feedback</span>
          </div>
        </FormButton>
        <FormButton
          color="subtle"
          size="sm"
          external
          to="https://www.gendo.ai/terms-of-service"
          target="_blank"
        >
          <div class="flex items-center gap-1 text-foreground-2 font-normal">
            <span>Terms</span>
          </div>
        </FormButton>
      </div>
    </div>
    <template v-if="limits" #actions>
      <div class="text-body-2xs p-1">
        {{ limits.used }}/{{ limits.limit }} free renders used
        <span class="hidden-under-250">this month</span>
      </div>
    </template>
    <FeedbackDialog v-model:open="isFeedbackOpen" type="gendo" />
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
import dayjs from 'dayjs'

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

const { activeUser } = useActiveUser()

const prompt = ref<string>()
const isLoading = ref(false)
const timeOutWait = ref(false)
const isFeedbackOpen = ref(false)

const suggestedPrompts = ref<string[]>([
  'Example: Minimalist Scandinavian interior with warm natural lighting...',
  'Example: Luxury penthouse with floor-to-ceiling windows and city views...',
  'Example: Cozy industrial loft with exposed brick and steel elements...',
  'Example: Modern office space with biophilic design elements...',
  'Example: High-end retail space with dramatic lighting...'
])

const isGendoEnabled = useIsGendoModuleEnabled()

const isGendoPanelEnabled = computed(() => !!activeUser.value && !!isGendoEnabled.value)

const { result, refetch } = useQuery(activeUserGendoLimits, undefined, {
  enabled: isGendoPanelEnabled
})

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

const formattedResetDate = computed(() => {
  if (!limits.value?.resetDate) return ''
  return dayjs(limits.value.resetDate).format('Do MMMM YYYY')
})

const enqueMagic = async () => {
  isLoading.value = true
  const pass = [
    ...viewerInstance.getRenderer().pipeline.getPass('DEPTH'),
    ...viewerInstance.getRenderer().pipeline.getPass('DEPTH-NORMAL')
  ]
  const [depthData, width, height] = await viewerInstance
    .getExtension(PassReader)
    .read(pass)
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
