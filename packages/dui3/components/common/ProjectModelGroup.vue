<template>
  <div
    v-if="projectDetails && !projectError"
    class="p-2 bg-foundation dark:bg-neutral-700/10 rounded-md shadow"
  >
    <button
      class="flex w-full items-center text-foreground-2 justify-between hover:bg-blue-500/10 rounded-md transition group"
      @click="showModels = !showModels"
    >
      <div class="flex items-center transition group-hover:text-primary h-10 min-w-0">
        <ChevronDownIcon
          :class="`w-5 ${showModels ? '' : '-rotate-90'} transition mt-1`"
        />
        <div class="font-bold text-left truncate select-none">
          {{ projectDetails.name }}
        </div>
      </div>

      <div class="rounded-md px-2 flex items-center space-x-2 justify-end">
        <button v-tippy="'Open project in browser'" class="hover:text-primary">
          <ArrowTopRightOnSquareIcon
            class="w-4"
            @click.stop="
              $openUrl(projectUrl),
                trackEvent('DUI3 Action', { name: 'Project View' }, project.accountId)
            "
          />
        </button>
      </div>
    </button>

    <div v-show="showModels" class="space-y-4 mt-3 pb-2">
      <ModelSender
        v-for="model in project.senders"
        :key="model.modelCardId"
        :model-card="model"
        :project="project"
      />
      <ModelReceiver
        v-for="model in project.receivers"
        :key="model.modelCardId"
        :model-card="model"
        :project="project"
      />
    </div>
  </div>
  <div
    v-if="projectError"
    class="px-2 py-4 bg-foundation dark:bg-neutral-700/10 rounded-md shadow"
  >
    <CommonAlert color="info" with-dismiss @dismiss="projectError = undefined">
      <template #title>
        Whoops - project
        <code>{{ project.projectId }}</code>
        is inaccessible.
      </template>
      <template #description>
        Apollo error:
        <code>{{ projectError }}</code>

        <div v-if="!hasAccountMatch" class="my-4">
          This might have happened because you do not have a valid account that can
          access it.
        </div>
      </template>
    </CommonAlert>
  </div>
</template>
<script setup lang="ts">
import { useQuery, useSubscription } from '@vue/apollo-composable'
import { ChevronDownIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/20/solid'
import { ProjectModelGroup, useHostAppStore } from '~~/store/hostApp'
import { useAccountStore } from '~~/store/accounts'
import {
  projectDetailsQuery,
  versionCreatedSubscription
} from '~~/lib/graphql/mutationsAndQueries'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import { ApolloError } from '@apollo/client/errors'

const { trackEvent } = useMixpanel()
const accountStore = useAccountStore()
const hostAppStore = useHostAppStore()
const { $openUrl } = useNuxtApp()

const props = defineProps<{
  project: ProjectModelGroup
}>()

const hasAccountMatch = !!accountStore.accounts.find(
  (acc) => acc.accountInfo.id === props.project.accountId
)
const { result: projectDetailsResult, onError } = useQuery(
  projectDetailsQuery,
  () => ({ projectId: props.project.projectId }),
  () => ({
    clientId: hasAccountMatch
      ? props.project.accountId
      : accountStore.activeAccount.accountInfo.id
  })
)

const projectError = ref<string>()
onError((err: ApolloError) => {
  projectError.value = err.message
})
const projectDetails = computed(() => projectDetailsResult.value?.project)

const showModels = ref(true)

const projectUrl = computed(() => {
  const acc = accountStore.accounts.find(
    (acc) => acc.accountInfo.id === props.project.accountId
  )
  return `${acc?.accountInfo.serverInfo.url as string}/projects/${
    props.project.projectId
  }`
})

// Subscribe to version created events at a project level, and filter to any receivers (if any)
const { onResult } = useSubscription(
  versionCreatedSubscription,
  () => ({ projectId: props.project.projectId }),
  () => ({
    clientId: hasAccountMatch
      ? props.project.accountId
      : accountStore.activeAccount.accountInfo.id
  })
)

onResult((res) => {
  if (!res.data) return
  if (res.data?.projectVersionsUpdated?.type !== 'CREATED') return

  const relevantReceiver = props.project.receivers.find(
    (r) => r.modelId === res.data?.projectVersionsUpdated.version?.model.id
  )
  if (!relevantReceiver) return

  hostAppStore.patchModel(relevantReceiver.modelCardId, {
    latestVersionId: res.data.projectVersionsUpdated.version?.id,
    hasDismissedUpdateWarning: false,
    displayReceiveComplete: false
  })

  // res.data.projectVersionsUpdated.version.
})
</script>
