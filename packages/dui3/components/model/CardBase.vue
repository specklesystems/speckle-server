<template>
  <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events vuejs-accessibility/no-static-element-interactions -->
  <div
    :class="`rounded-md hover:shadow-md shadow transition overflow-hidden ${cardBgColor} border-foundation hover:border-outline-2 border-2 group`"
  >
    <div v-if="modelData" class="relative px-1 py-1">
      <div class="relative flex items-center space-x-2 min-w-0">
        <div class="text-foreground-2 mt-[2px] flex items-center -space-x-2 relative">
          <!-- CTA button -->
          <FormButton
            v-tippy="buttonTooltip"
            color="outline"
            :icon-left="
              modelCard.progress
                ? XCircleIcon
                : isSender
                ? ArrowUpTrayIcon
                : ArrowDownTrayIcon
            "
            hide-text
            class=""
            :disabled="!canEdit"
            @click.stop="$emit('manual-publish-or-load')"
          ></FormButton>
        </div>

        <div class="grow min-w-0 max-[160px]:hidden">
          <div class="text-body-3xs text-foreground-2 truncate">
            {{ folderPath }}
          </div>
          <div
            class="text-heading-sm truncate text-foreground dark:text-foreground-2 select-none leading-4"
          >
            {{ modelData.displayName }}
          </div>
        </div>

        <!-- TODO: uncomment if needed, this is a hack to hide this from two apps where we don't support it -->
        <div class="flex items-center justify-end grow">
          <AutomateResultDialog
            v-if="isSender && summary"
            :model-card="modelCard"
            :automation-runs="automationRuns"
            :project-id="modelCard.projectId"
            :model-id="modelCard.modelId"
          >
            <template #activator="{ toggle }">
              <button
                v-tippy="summary.summary.value.longSummary"
                class="action action-normal p-1 hover:bg-highlight-2 rounded-md transition"
                @click.stop="toggle()"
              >
                <AutomateRunsTriggerStatusIcon
                  :summary="summary.summary.value"
                  class="h-4 w-4"
                />
              </button>
            </template>
          </AutomateResultDialog>
          <FormButton
            v-if="store.hostAppName !== 'navisworks' && store.hostAppName !== 'etabs'"
            v-tippy="'Highlight'"
            color="subtle"
            :icon-left="CursorArrowRaysIcon"
            hide-text
            size="sm"
            @click="highlightModel"
          />
          <ModelActionsDialog
            :model-card="modelCard"
            :model-name="modelData.displayName"
            @view="viewModel"
            @view-versions="viewModelVersions"
            @remove="removeModel"
          />
        </div>
      </div>
      <div class="max-[160px]:flex w-full hidden px-1 mt-2 h-[40px] items-center">
        <div class="grow min-w-0">
          <div class="text-body-3xs text-foreground-2 truncate">
            {{ folderPath }}
          </div>
          <div
            class="text-heading-sm truncate text-foreground dark:text-foreground-2 select-none leading-4"
          >
            {{ modelData.displayName }}
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="loading" class="px-1 py-1">
      Fetching model data...
      <CommonLoadingBar loading />
    </div>
    <div v-else class="px-1 py-1">Error loading data.</div>

    <!-- Slot to allow senders or receivers to hoist their own buttons/ui -->
    <!-- class="px-2 h-0 group-hover:h-auto transition-all overflow-hidden" -->
    <div v-if="canEdit" class="px-1">
      <slot></slot>
    </div>

    <!-- Progress state -->
    <div
      v-if="modelCard.progress"
      :class="`${
        modelCard.progress ? 'h-10 opacity-100' : 'h-0 opacity-0 py-0'
      } overflow-hidden bg-highlight-2`"
    >
      <CommonLoadingProgressBar
        :loading="!!modelCard.progress"
        :progress="modelCard.progress ? modelCard.progress.progress : undefined"
      />
      <div class="text-body-3xs px-2 h-full flex items-center text-foreground">
        {{ modelCard.progress?.status || '...' }}
        {{
          modelCard.progress?.progress
            ? ((props.modelCard.progress?.progress as number) * 100).toFixed() + '%'
            : ''
        }}
      </div>
    </div>
    <div v-if="canEdit">
      <!-- Card States: Expiry, errors, new version created, etc. -->
      <slot name="states"></slot>
      <div class="relative">
        <!-- Swanky web app integration: show users who is viewing the model -->
        <Transition name="bounce">
          <div
            v-if="currentlyViewingUsers.length !== 0"
            class="text-body-3xs text-foreground-2 py-1 px-1 bg-highlight-1 border-t border-t-highlight-3 flex space-x-1 items-center justify-between"
          >
            <div class="flex items-center space-x-1">
              <UserAvatarGroup size="xs" :users="currentlyViewingUsers" />
              <span class="line-clamp-1">
                {{ currentlyViewingUsers.length === 1 ? 'is' : 'are' }} now viewing
              </span>
            </div>
            <div>
              <FormButton size="sm" color="outline" full-width @click="viewModel()">
                Join
              </FormButton>
            </div>
          </div>
        </Transition>
        <!-- Swanky web app integration: show comment created notification -->
        <Transition name="bounce">
          <div v-if="latestCommentNotification">
            <div class="h-[1px] bg-blue-500/20 disappearing-bar"></div>
            <div
              class="text-body-3xs text-foreground-2 py-1 px-1 bg-highlight-1 flex space-x-1 items-center justify-between"
            >
              <div
                v-tippy="
                  `${latestCommentNotification.comment?.author.name} just left a
                  comment.`
                "
                class="flex items-center space-x-1"
              >
                <UserAvatarGroup
                  size="xs"
                  :users="[latestCommentNotification.comment?.author]"
                />
                <span class="line-clamp-1">
                  {{ latestCommentNotification.comment?.author.name }} just left a
                  comment.
                </span>
              </div>
              <div>
                <FormButton size="sm" color="outline" full-width @click="viewComment()">
                  Reply
                </FormButton>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
    <div v-else>
      <CommonModelNotification
        :notification="{
          modelCardId: modelCard.modelCardId,
          dismissible: false,
          level: 'danger',
          text: disabledMessage
        }"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery, useSubscription } from '@vue/apollo-composable'
import {
  automateRunsSubscription,
  automateStatusQuery,
  modelCommentCreatedSubscription,
  modelDetailsQuery,
  modelViewingSubscription
} from '~/lib/graphql/mutationsAndQueries'
import { CommonLoadingProgressBar } from '@speckle/ui-components'
import { ArrowUpTrayIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/solid'
import type { ProjectModelGroup } from '~~/store/hostApp'
import { useHostAppStore } from '~~/store/hostApp'
import type { IModelCard } from '~~/lib/models/card'
import { useAccountStore } from '~/store/accounts'
import type { IReceiverModelCard } from '~/lib/models/card/receiver'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import { useIntervalFn, useTimeoutFn } from '@vueuse/core'
import type { ProjectCommentsUpdatedMessage } from '~/lib/common/generated/gql/graphql'
import { useFunctionRunsStatusSummary } from '~/lib/automate/runStatus'
import { CursorArrowRaysIcon, XCircleIcon } from '@heroicons/vue/24/outline'

const app = useNuxtApp()
const store = useHostAppStore()
const accStore = useAccountStore()
const { trackEvent } = useMixpanel()

const props = defineProps<{
  modelCard: IModelCard
  project: ProjectModelGroup
  canEdit: boolean
}>()

defineEmits<{
  (e: 'manual-publish-or-load'): void
}>()

const isSender = computed(() => {
  return props.modelCard.typeDiscriminator.includes('SenderModelCard')
})

const buttonTooltip = computed(() => {
  return props.modelCard.progress
    ? 'Cancel'
    : isSender.value
    ? 'Publish model'
    : 'Load selected version'
})

const projectAccount = computed(() =>
  accStore.accountWithFallback(props.project.accountId, props.project.serverUrl)
)

const disabledMessage = computed(() =>
  isSender.value
    ? 'Publish is not permitted by your role on this project.'
    : 'Load is not permitted by your role on this project.'
)

const clientId = projectAccount.value.accountInfo.id

const { result: modelResult, loading } = useQuery(
  modelDetailsQuery,
  () => ({
    projectId: props.project.projectId,
    modelId: props.modelCard.modelId
  }),
  () => ({ clientId })
)

const modelData = computed(() => modelResult.value?.project.model)
const queryData = computed(() => modelResult.value?.project)

const folderPath = computed(() => {
  const splitName = modelData.value?.name.split('/')
  if (!splitName || splitName.length === 1) return ' '
  const withoutLast = splitName.slice(0, -1)
  return withoutLast.join('/')
})

const { result: automateResult, refetch } = useQuery(
  automateStatusQuery,
  () => ({
    projectId: props.project.projectId,
    modelId: props.modelCard.modelId
  }),
  () => ({ clientId })
)

const automationRuns = computed(
  () => automateResult.value?.project.model.automationsStatus?.automationRuns
)

const { onResult: onAutomateRunResult } = useSubscription(
  automateRunsSubscription,
  () => ({ projectId: props.project.projectId }),
  () => ({ clientId })
)

onAutomateRunResult(() => {
  refetch()
})

const summary = computed(() => {
  if (!automationRuns.value) {
    return undefined
  }
  return useFunctionRunsStatusSummary({
    runs: automationRuns.value
  })
})

provide<IModelCard>('cardBase', props.modelCard)

const highlightModel = () => {
  if (!modelData.value) return

  // Some host apps aren't friendly enough to handle highlighting models when some other ops are running.
  if (props.modelCard.progress) return

  // Do not highlight if baked object ids not set yet. Otherwise we rely on connector to handle it, don't if possible to handle here!
  if (!isSender.value && !(props.modelCard as IReceiverModelCard).bakedObjectIds) {
    store.setModelError({
      modelCardId: props.modelCard.modelCardId,
      error: 'No objects found to highlight.'
    })
    return
  }

  app.$baseBinding.highlightModel(props.modelCard.modelCardId)
  trackEvent('DUI3 Action', { name: 'Highlight Model' }, props.modelCard.accountId)
}

const viewModel = () => {
  // previously with DUI2, it was Stream View but actually it is "Version View" now. Also having conflict with old/new terminology.
  trackEvent('DUI3 Action', { name: 'Version View' }, props.modelCard.accountId)
  app.$baseBinding.openUrl(
    `${projectAccount.value.accountInfo.serverInfo.url}/projects/${props.modelCard?.projectId}/models/${props.modelCard.modelId}`
  )
}

const viewModelVersions = () => {
  app.$baseBinding.openUrl(
    `${projectAccount.value.accountInfo.serverInfo.url}/projects/${props.modelCard?.projectId}/models/${props.modelCard.modelId}/versions`
  )
}

const removeModel = () => {
  store.removeModel(props.modelCard)
}

defineExpose({
  viewModel,
  modelData,
  queryData
})

const cardBgColor = computed(() => {
  // if (props.modelCard.error || !props.canEdit)
  //   return 'bg-red-500/10 hover:bg-red-500/20'
  // if (props.modelCard.expired) return 'bg-blue-500/10 hover:bg-blue-500/20'
  // if (
  //   (props.modelCard as ISenderModelCard).latestCreatedVersionId ||
  //   (props.modelCard as IReceiverModelCard).displayReceiveComplete === true
  // ) {
  //   if (failRate.value > 80) {
  //     return 'bg-orange-500/10'
  //   }
  //   return 'bg-blue-500/10 hover:bg-blue-500/20'
  // }
  // if (
  //   (props.modelCard as IReceiverModelCard).selectedVersionId !==
  //     (props.modelCard as IReceiverModelCard).latestVersionId &&
  //   !(props.modelCard as IReceiverModelCard).hasDismissedUpdateWarning
  // )
  //   return 'bg-orange-500/10'
  return 'bg-foundation xxxhover:bg-highlight-1'
})

const { onResult: onModelViewingResult } = useSubscription(
  modelViewingSubscription,
  () => ({
    target: {
      projectId: props.modelCard.projectId,
      resourceIdString: props.modelCard.modelId
    }
  }),
  () => ({ clientId })
)

const currentlyViewingUsersMap = ref<
  Record<string, { name: string; id: string; avatar?: string | null; lastSeen: number }>
>({})

const currentlyViewingUsers = computed(() =>
  Object.values(currentlyViewingUsersMap.value)
)

onModelViewingResult((res) => {
  const user = res.data?.viewerUserActivityBroadcasted.user
  if (res.data?.viewerUserActivityBroadcasted.status === 'VIEWING' && user) {
    // add user to currently viewing people
    currentlyViewingUsersMap.value[user.id] = { ...user, lastSeen: Date.now() }
  } else if (
    res.data?.viewerUserActivityBroadcasted.status === 'DISCONNECTED' &&
    user
  ) {
    // remove user from currently viewing people
    delete currentlyViewingUsersMap.value[user.id]
  }
})

// NOTE: FE does not send a disconnect event on page unload, so we need to do our own cleanup
useIntervalFn(() => {
  const now = Date.now()
  for (const key in currentlyViewingUsersMap.value) {
    const { lastSeen } = currentlyViewingUsersMap.value[key]
    if (now - lastSeen > 5_000) delete currentlyViewingUsersMap.value[key]
  }
}, 1000)

const { onResult: onCommentResult } = useSubscription(
  modelCommentCreatedSubscription,
  () => ({
    target: {
      projectId: props.modelCard.projectId,
      resourceIdString: props.modelCard.modelId
    }
  }),
  () => ({ clientId })
)

const latestCommentNotification = ref<ProjectCommentsUpdatedMessage>()

const { start: startCommentClearTimeout, stop: stopCommentClearTimeout } = useTimeoutFn(
  () => {
    latestCommentNotification.value = undefined
    stopCommentClearTimeout()
  },
  30_000
)

onCommentResult((res) => {
  latestCommentNotification.value = res.data?.projectCommentsUpdated
  startCommentClearTimeout()
})

const viewComment = () => {
  trackEvent('DUI3 Action', { name: 'Comment View' }, props.modelCard.accountId)
  if (!latestCommentNotification.value?.comment) return

  const commentId =
    latestCommentNotification.value?.comment?.parent?.id ||
    latestCommentNotification.value?.comment.id

  app.$baseBinding.openUrl(
    `${projectAccount.value.accountInfo.serverInfo.url}/projects/${props.modelCard?.projectId}/models/${props.modelCard.modelId}#threadId=${commentId}`
  )
}
</script>
<style scoped lang="css">
@keyframes disappear-width {
  0% {
    width: 100%;
  }

  100% {
    display: none;
    width: 0%;
  }
}

.disappearing-bar {
  animation: disappear-width 30s;
}

.bounce-enter-active {
  animation: bounce-in 0.5s;
}

.bounce-leave-active {
  animation: bounce-in 0.5s reverse;
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}
</style>
