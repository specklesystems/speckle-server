<template>
  <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events vuejs-accessibility/no-static-element-interactions -->
  <div
    :class="`rounded-md hover:shadow-md shadow transition overflow-hidden ${cardBgColor} cursor-pointer dark:border-gray-800 border-gray-300 border`"
    @click="highlightModel"
  >
    <div v-if="modelData" class="relative px-2 py-2">
      <div class="relative flex items-center space-x-2 min-w-0">
        <div class="text-foreground-2 mt-[2px] flex items-center -space-x-2 relative">
          <!-- CTA button -->
          <button
            v-if="!noWriteAccess"
            v-tippy="buttonTooltip"
            class="z-10 transition hover:scale-110 rounded-full hover:shadow-md bg-foundation text-primary"
            @click.stop="$emit('manual-publish-or-load')"
          >
            <template v-if="!modelCard.progress">
              <ArrowUpCircleIcon v-if="isSender" class="w-8" />
              <ArrowDownCircleIcon v-else class="w-8" />
            </template>
            <template v-else>
              <XCircleIcon class="w-8" />
            </template>
          </button>

          <button
            v-else
            class="z-10 transition rounded-full hover:shadow-md bg-foundation"
          >
            <!-- <ExclamationCircleIcon class="w-8 text-danger" /> -->
            <ArrowUpCircleIcon v-if="isSender" class="w-8 text-danger" />
            <ArrowDownCircleIcon v-else class="w-8 text-danger" />
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
        <ModelActionsDialog
          :model-card="modelCard"
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
    <div v-if="!noWriteAccess" class="px-2">
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
    <div v-if="!noWriteAccess">
      <slot name="states"></slot>
    </div>
    <div v-else>
      <CommonModelNotification
        :notification="{
          modelCardId: modelCard.modelCardId,
          dismissible: false,
          level: 'danger',
          text: 'You do not have write access: you cannot update this model. Contact the project owner!'
        }"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { modelDetailsQuery } from '~/lib/graphql/mutationsAndQueries'
import { CommonLoadingProgressBar } from '@speckle/ui-components'
import { XCircleIcon } from '@heroicons/vue/20/solid'
import { ArrowUpCircleIcon, ArrowDownCircleIcon } from '@heroicons/vue/24/solid'
import type { ProjectModelGroup } from '~~/store/hostApp'
import { useHostAppStore } from '~~/store/hostApp'
import type { IModelCard } from '~~/lib/models/card'
import { useAccountStore } from '~/store/accounts'
import type { ISenderModelCard } from 'lib/models/card/send'
import type { IReceiverModelCard } from '~/lib/models/card/receiver'
import { useMixpanel } from '~/lib/core/composables/mixpanel'

const app = useNuxtApp()
const store = useHostAppStore()
const accStore = useAccountStore()
const { trackEvent } = useMixpanel()

const props = withDefaults(
  defineProps<{
    modelCard: IModelCard
    project: ProjectModelGroup
    readonly?: boolean
  }>(),
  {
    readonly: false
  }
)

defineEmits<{
  (e: 'manual-publish-or-load'): void
}>()

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

provide<IModelCard>('cardBase', props.modelCard)

const isSender = computed(() => {
  return props.modelCard.typeDiscriminator === 'SenderModelCard'
})

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
  if (props.modelCard.error || noWriteAccess.value)
    return 'bg-red-500/10 hover:bg-red-500/20'
  if (props.modelCard.expired) return 'bg-blue-500/10 hover:bg-blue-500/20'
  if (
    (props.modelCard as ISenderModelCard).latestCreatedVersionId ||
    (props.modelCard as IReceiverModelCard).displayReceiveComplete === true
  )
    return 'bg-green-500/10 hover:bg-green-500/20'
  if (
    (props.modelCard as IReceiverModelCard).selectedVersionId !==
      (props.modelCard as IReceiverModelCard).latestVersionId &&
    !(props.modelCard as IReceiverModelCard).hasDismissedUpdateWarning
  )
    return 'bg-orange-500/10'
  return 'bg-foundation dark:bg-neutral-800 hover:bg-blue-500/10 '
})

const noWriteAccess = computed(() => {
  return props.readonly && isSender.value
})
</script>
