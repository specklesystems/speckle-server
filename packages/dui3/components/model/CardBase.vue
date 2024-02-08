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
          @click="app.$baseBinding.highlightModel(modelCard.id)"
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
      Loading...
      <CommonLoadingBar loading />
    </div>
    <div v-else class="px-1 py-1">Error loading data.</div>

    <!-- Slot to allow senders or receivers to hoist their own buttons/ui -->
    <div class="px-2">
      <slot></slot>
    </div>

    <!-- Progress state -->
    <div
      :class="`${
        modelCard.progress ? 'h-9 opacity-100' : 'h-0 opacity-0 py-0'
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

    <!-- Card Notifications -->
    <div>
      <CommonModelNotification
        v-for="(notification, index) in modelCard.notifications"
        :key="index"
        :index="index"
        :notification="notification"
        @dismiss="store.dismissModelNotification(modelCard.id, index)"
      />
    </div>
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

const cardBgColor = computed(() => {
  if (!props.modelCard.notifications || props.modelCard.notifications?.length === 0)
    return 'bg-foundation-2'

  const notification = props.modelCard.notifications[0]
  switch (notification.level) {
    case 'danger':
      return 'bg-red-500/10'
    case 'info':
      return 'bg-blue-500/10'
    case 'success':
      return 'bg-green-500/10'
    case 'warning':
      return 'bg-orange-500/10'
  }
})
</script>
