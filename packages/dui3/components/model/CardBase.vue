<template>
  <div
    :class="`rounded-md hover:shadow-md shadow transition overflow-hidden outline outline-blue-500/5 ${cardBgColor}`"
  >
    <div v-if="modelData" class="px-2 py-2">
      <div class="flex items-center space-x-2 min-w-0">
        <UserAvatar :user="modelData.author" size="sm" class="max-[275px]:hidden" />
        <div class="truncate font-bold text-foreground grow select-none">
          {{ modelData.displayName }}
        </div>
        <button
          v-tippy="'Select objects'"
          class="transition hover:text-primary -mt-1"
          @click="app.$baseBinding.highlightModel(modelCard.modelCardId)"
        >
          <CursorArrowRaysIcon class="w-4" />
        </button>
        <ModelActionsDialog
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
import { CursorArrowRaysIcon } from '@heroicons/vue/24/outline'
import { ProjectModelGroup, useHostAppStore } from '~~/store/hostApp'
import { IModelCard } from '~~/lib/models/card'
import { useAccountStore } from '~/store/accounts'
import { ISenderModelCard } from 'lib/models/card/send'

const app = useNuxtApp()

const props = defineProps<{
  modelCard: IModelCard
  project: ProjectModelGroup
}>()

const { result: modelResult, loading } = useQuery(
  modelDetailsQuery,
  () => ({
    projectId: props.project.projectId,
    modelId: props.modelCard.modelId
  }),
  () => ({ clientId: props.modelCard.accountId })
)

const modelData = computed(() => modelResult.value?.project.model)

const store = useHostAppStore()
const accStore = useAccountStore()

const acc = accStore.accounts.find(
  (acc) => acc.accountInfo.id === props.modelCard.accountId
)

const viewModel = () => {
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
  viewModel
})

const cardBgColor = computed(() => {
  if (props.modelCard.error) return 'bg-red-500/10'
  if (props.modelCard.expired) return 'bg-blue-500/10'
  if ((props.modelCard as ISenderModelCard).latestCreatedVersionId)
    return 'bg-green-500/10'
  return 'bg-foundation'
})
</script>
