<template>
  <div v-if="projectDetails" class="px-[2px] rounded-md">
    <button
      :class="`flex w-full items-center text-foreground-2 justify-between hover:bg-foundation-2 ${
        showModels ? '' : 'bg-foundation-2'
      } rounded-md transition group`"
      @click="showModels = !showModels"
    >
      <div class="flex items-center transition group-hover:text-primary h-8 min-w-0">
        <CommonIconsArrowFilled
          :class="`w-5 ${showModels ? '' : '-rotate-90'} transition`"
        />
        <div class="text-sm text-left truncate select-none flex items-center leading-1">
          <div class="text-heading-sm">{{ projectDetails.name }}</div>
          <div v-if="!showModels" class="text-body-3xs opacity-50 ml-2 pt-[1px]">
            {{ project.senders.length + project.receivers.length }}
          </div>
        </div>
      </div>

      <div class="opacity-0 group-hover:opacity-100 transition flex">
        <!-- <button
          v-tippy="'Open project in browser'"
          class="hover:text-primary flex items-center space-x-2 p-2"
        >
          <PlusIcon
            class="w-4"
            @click.stop="
              $openUrl(projectUrl),
                trackEvent('DUI3 Action', { name: 'Project View' }, project.accountId)
            "
          />
        </button> -->
        <button
          v-tippy="'Open project in browser'"
          class="hover:text-primary flex items-center space-x-2 p-2"
        >
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

    <div v-show="showModels" class="space-y-2 mt-2 pb-1">
      <CommonAlert
        v-if="isWorkspaceReadOnly"
        size="xs"
        :color="'warning'"
        :actions="[
          {
            title: 'Subscribe',
            onClick: () => $openUrl(workspaceUrl)
          }
        ]"
      >
        <template #description>
          The workspace is in a read-only locked state until there's an active
          subscription. Subscribe to a plan to regain full access.
        </template>
      </CommonAlert>
      <ModelSender
        v-for="model in project.senders"
        :key="model.modelCardId"
        :model-card="model"
        :project="project"
        :readonly="isProjectReadOnly || isWorkspaceReadOnly"
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
    v-if="projectIsAccesible && !projectIsAccesible"
    class="px-2 py-4 bg-foundation dark:bg-neutral-700/10 rounded-md shadow"
  >
    <CommonAlert
      color="danger"
      with-dismiss
      @dismiss="askDismissProjectQuestionDialog = true"
    >
      <template #title>
        Whoops - project
        <code>{{ project.projectId }}</code>
        is inaccessible.
      </template>
    </CommonAlert>
    <CommonDialog v-model:open="askDismissProjectQuestionDialog" fullscreen="none">
      <template #header>Remove Project</template>
      <div class="text-xs mb-4">Do you want to remove the project from this file?</div>
      <div class="flex justify-between center py-2 space-x-3">
        <FormButton size="sm" full-width @click="removeProjectModels">Yes</FormButton>
        <FormButton
          size="sm"
          full-width
          @click="askDismissProjectQuestionDialog = false"
        >
          Hide error
        </FormButton>
      </div>
    </CommonDialog>
  </div>
</template>
<script setup lang="ts">
import { useQuery, useSubscription } from '@vue/apollo-composable'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/20/solid'
import type { ProjectModelGroup } from '~~/store/hostApp'
import { useHostAppStore } from '~~/store/hostApp'
import { useAccountStore } from '~~/store/accounts'
import {
  projectDetailsQuery,
  versionCreatedSubscription,
  userProjectsUpdatedSubscription,
  projectUpdatedSubscription
} from '~~/lib/graphql/mutationsAndQueries'
import { useMixpanel } from '~/lib/core/composables/mixpanel'

const { trackEvent } = useMixpanel()
const accountStore = useAccountStore()
const hostAppStore = useHostAppStore()
const { $openUrl } = useNuxtApp()

const props = defineProps<{
  project: ProjectModelGroup
}>()

const showModels = ref(true)
const askDismissProjectQuestionDialog = ref(false)
const writeAccessRequested = ref(false)
const projectIsAccesible = ref(undefined)

const projectAccount = computed(() =>
  accountStore.accountWithFallback(props.project.accountId, props.project.serverUrl)
)

const clientId = projectAccount.value.accountInfo.id

const { result: projectDetailsResult, refetch: refetchProjectDetails } = useQuery(
  projectDetailsQuery,
  () => ({ projectId: props.project.projectId }),
  () => ({ clientId })
)

const removeProjectModels = async () => {
  await hostAppStore.removeProjectModels(props.project.projectId)
  askDismissProjectQuestionDialog.value = false
}

const projectDetails = computed(() => projectDetailsResult.value?.project)

watch(projectDetails, (newValue) => {
  projectIsAccesible.value = newValue !== undefined
})

const isProjectReadOnly = computed(() => {
  if (!projectDetails.value) return true

  if (
    projectDetails.value?.role === null ||
    projectDetails.value?.role === 'stream:reviewer'
  )
    return true
  return false
})

const isWorkspaceReadOnly = computed(() => {
  if (!projectDetails.value?.workspace) return false // project is not even in a workspace
  return projectDetails.value?.workspace?.readOnly
})

// Enable later when FE2 is ready for accepting/denying requested accesses
// const hasServerMatch = computed(() =>
//   accountStore.isAccountExistsByServer(props.project.serverUrl)
// )

// const requestWriteAccess = async () => {
//   if (hasServerMatch.value) {
//     const { mutate } = provideApolloClient((projectAccount.value as DUIAccount).client)(
//       () => useMutation(requestProjectAccess)
//     )
//     const res = await mutate({
//       input: projectDetails.value?.id as string
//     })
//     writeAccessRequested.value = true
//     // TODO: It throws if it has already pending request, handle it!
//     console.log(res)
//   }
// }

const { onResult: userProjectsUpdated } = useSubscription(
  userProjectsUpdatedSubscription,
  () => ({}),
  () => ({ clientId })
)

const { onResult: projectUpdated } = useSubscription(
  projectUpdatedSubscription,
  () => ({ projectId: props.project.projectId }),
  () => ({ clientId })
)

// to catch changes on visibility of project
projectUpdated((res) => {
  // TODO: FIX needed: whenever project visibility changed from "discoverable" to "private", we can't get message if the `clientId` is not part of the team
  // validated with Fabians this is a current behavior.
  if (!res.data) return
  refetchProjectDetails()
})

// to catch changes on team of the project
userProjectsUpdated((res) => {
  if (!res.data) return
  refetchProjectDetails()
  writeAccessRequested.value = false
})

const projectUrl = computed(() => {
  const acc = accountStore.accounts.find((acc) => acc.accountInfo.id === clientId)
  return `${acc?.accountInfo.serverInfo.url as string}/projects/${
    props.project.projectId
  }`
})

const workspaceUrl = computed(() => {
  const acc = accountStore.accounts.find((acc) => acc.accountInfo.id === clientId)
  return `${acc?.accountInfo.serverInfo.url as string}/workspaces/${
    projectDetails.value?.workspace?.slug
  }`
})

// Subscribe to version created events at a project level, and filter to any receivers (if any)
const { onResult } = useSubscription(
  versionCreatedSubscription,
  () => ({ projectId: props.project.projectId }),
  () => ({ clientId })
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
    latestVersionCreatedAt: res.data.projectVersionsUpdated.version?.createdAt,
    hasDismissedUpdateWarning: false,
    displayReceiveComplete: false
  })
})
</script>
