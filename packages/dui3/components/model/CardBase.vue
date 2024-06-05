<template>
  <div
    :class="`rounded-md hover:shadow-md shadow transition overflow-hidden ${cardBgColor}`"
  >
    <div v-if="modelData" class="px-2 py-2">
      <div class="flex items-center space-x-2 min-w-0">
        <div class="text-foreground-2 mt-[2px] flex items-center -space-x-2 relative">
          <div v-if="!isSender" title="you are loading this model" class="z-10">
            <ArrowDownCircleIcon
              v-if="!isSender"
              class="w-8 text-blue-500 drop-shadowxxx"
            />
          </div>

          <button
            v-tippy="'Update model'"
            class="z-10 transition hover:scale-110 rounded-full hover:shadow-md hover:bg-foundation text-primary"
          >
            <ArrowUpCircleIcon class="w-8" />
          </button>

          <UserAvatar
            :user="modelData.author"
            size="sm"
            class="z-0 max-[275px]:hidden"
          />
        </div>
        <div
          class="truncate font-bold text-foreground grow select-none -mt-[2px]"
          :title="modelData.name"
        >
          {{ modelData.displayName }}
        </div>
        <!-- TBD: Report -->
        <button
          v-if="isSender ? (modelCard as ISenderModelCard).report : (modelCard as IReceiverModelCard).receiveResult?.receiveConversionResults"
          v-tippy="`Show ${isSender ? 'publish' : 'load'} report`"
          class="transition hover:text-primary -mt-1"
          @click="showReportDialog = true"
        >
          <DocumentArrowUpIcon v-if="isSender" class="w-4" />
          <DocumentArrowDownIcon v-else class="w-4" />
        </button>
        <LayoutDialog
          v-model:open="showReportDialog"
          :title="`${isSender ? 'Publish' : 'Load'} Report`"
          chromium65-compatibility
        >
          <SendReport
            v-if="isSender"
            :reports="(modelCard as ISenderModelCard).report"
          ></SendReport>
          <ReceiveReport
            v-else
            :model-card="(modelCard as IReceiverModelCard)"
          ></ReceiveReport>
        </LayoutDialog>

        <button
          v-tippy="'Highlight objects in app'"
          class="transition hover:text-primary -mt-1"
          @click="highlightModel"
        >
          <CursorArrowRaysIcon class="w-4" />
        </button>
        <ModelActionsDialog
          :model-name="modelData.displayName"
          @view="viewModel"
          @view-versions="viewModelVersions"
          @remove="removeModel"
        />
      </div>
    </div>
    <div v-else-if="loading" class="px-1 py-1">
      Fetching model data...
      <CommonLoadingBar loading />
    </div>
    <div v-else class="px-1 py-1">Error loading data.</div>

    <!-- Slot to allow senders or receivers to hoist their own buttons/ui -->
    <div class="px-2">
      <slot></slot>
    </div>

    <!-- Progress state -->
    <div
      v-if="modelCard.progress"
      :class="`${
        modelCard.progress ? 'h-10 opacity-100' : 'h-0 opacity-0 py-0'
      } overflow-hidden bg-blue-500/10`"
    >
      <CommonLoadingProgressBar
        :loading="!!modelCard.progress"
        :cancelled="modelCard.progress?.status === 'Cancelled'"
        :progress="modelCard.progress ? modelCard.progress.progress : undefined"
      />
      <div class="text-xs font-bold px-2 h-full flex items-center text-primary">
        {{ modelCard.progress?.status || '...' }}
        {{
          modelCard.progress?.progress
            ? ((props.modelCard.progress?.progress as number) * 100).toFixed() + '%'
            : ''
        }}
      </div>
    </div>

    <!-- Card States: Expiry, errors, new version created, etc. -->
    <slot name="states"></slot>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'

import { modelDetailsQuery } from '~/lib/graphql/mutationsAndQueries'
import { CommonLoadingProgressBar } from '@speckle/ui-components'
import {
  CursorArrowRaysIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon
} from '@heroicons/vue/24/outline'
import { ArrowUpCircleIcon, ArrowDownCircleIcon } from '@heroicons/vue/24/solid'
import { ProjectModelGroup, useHostAppStore } from '~~/store/hostApp'
import { IModelCard } from '~~/lib/models/card'
import { useAccountStore } from '~/store/accounts'
import { ISenderModelCard } from 'lib/models/card/send'
import { IReceiverModelCard } from '~/lib/models/card/receiver'
import { useMixpanel } from '~/lib/core/composables/mixpanel'

const app = useNuxtApp()
const { trackEvent } = useMixpanel()

const props = defineProps<{
  modelCard: IModelCard
  project: ProjectModelGroup
}>()

const showReportDialog = ref(false)

const { result: modelResult, loading } = useQuery(
  modelDetailsQuery,
  () => ({
    projectId: props.project.projectId,
    modelId: props.modelCard.modelId
  }),
  () => ({ clientId: props.modelCard.accountId })
)

const modelData = computed(() => modelResult.value?.project.model)
const queryData = computed(() => modelResult.value?.project)

const store = useHostAppStore()
const accStore = useAccountStore()

const acc = accStore.accounts.find(
  (acc) => acc.accountInfo.id === props.modelCard.accountId
)

const isSender = computed(() => {
  return props.modelCard.typeDiscriminator === 'SenderModelCard'
})

const highlightModel = () => {
  trackEvent('DUI3 Action', { name: 'Highlight Model' }, props.modelCard.accountId)
  app.$baseBinding.highlightModel(props.modelCard.modelCardId)
}

const viewModel = () => {
  // previously with DUI2, it was Stream View but actually it is "Version View" now. Also having conflict with old/new terminology.
  trackEvent('DUI3 Action', { name: 'Version View' }, props.modelCard.accountId)
  app.$baseBinding.openUrl(
    `${acc?.accountInfo.serverInfo.url}/projects/${props.modelCard?.projectId}/models/${props.modelCard.modelId}`
  )
}

const viewModelVersions = () => {
  app.$baseBinding.openUrl(
    `${acc?.accountInfo.serverInfo.url}/projects/${props.modelCard?.projectId}/models/${props.modelCard.modelId}/versions`
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
  if (props.modelCard.error) return 'bg-red-500/10 hover:bg-red-500/20'
  if (props.modelCard.expired) return 'bg-blue-500/10 hover:bg-blue-500/20'
  if (
    (props.modelCard as ISenderModelCard).latestCreatedVersionId ||
    (props.modelCard as IReceiverModelCard).receiveResult?.display === true
  )
    return 'bg-green-500/10 hover:bg-green-500/20'
  if (
    (props.modelCard as IReceiverModelCard).selectedVersionId !==
      (props.modelCard as IReceiverModelCard).latestVersionId &&
    !(props.modelCard as IReceiverModelCard).hasDismissedUpdateWarning
  )
    return 'bg-orange-500/10'
  return 'bg-foundation hover:bg-blue-500/10'
})
</script>
