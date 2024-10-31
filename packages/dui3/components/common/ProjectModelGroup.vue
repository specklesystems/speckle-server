<template>
  <div v-if="projectDetails && !projectError" class="px-[2px] pt-1 pb-1 rounded-md">
    <!-- <div
      v-if="isProjectReadOnly"
      class="px-2 py-1 mb-1 flex w-full items-center text-xs text-foreground-2 justify-between bg-white rounded-md transition group shadow"
    >
      <div v-if="writeAccessRequested">Write access request is pending...</div>
      <div v-else class="flex w-full items-center justify-between">
        You do not have write access to this project.
        TODO: Enable later when FE2 is ready for accepting/denying requested accesses
        <button
          v-if="isProjectReadOnly"
          v-tippy="'Request Write Access'"
          class="hover:text-primary"
        >
          <LockClosedIcon
            class="w-4"
            @click.stop="
              requestWriteAccess(),
                trackEvent(
                  'DUI3 Action',
                  { name: 'Request Write Access' },
                  projectAccount?.accountInfo.id
                )
            "
          />
        </button>
      </div>
    </div> -->
    <button
      :class="`flex w-full items-center text-foreground-2 justify-between hover:bg-blue-500/10 ${
        showModels ? '' : 'bg-blue-500/10'
      } rounded-md transition group`"
      @click="showModels = !showModels"
    >
      <div class="flex items-center transition group-hover:text-primary h-8 min-w-0">
        <ChevronDownIcon
          :class="`w-4 ${showModels ? '' : '-rotate-90'} transition mt-1`"
        />
        <div class="text-sm text-left truncate select-none flex items-center">
          <div>{{ projectDetails.name }}</div>
          <div v-if="!showModels" class="text-xs opacity-50 ml-2 pt-[1px]">
            {{ project.senders.length + project.receivers.length }}
          </div>
        </div>
      </div>

      <div class="opacity-0 group-hover:opacity-100 transition">
        <button
          v-tippy="'Open project in browser'"
          class="hover:text-primary flex items-center space-x-2 p-2"
        >
          <div class="text-xs text-left truncate select-none">
            {{ projectDetails.role ? projectDetails.role.split(':')[1] : '' }}
          </div>
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
      <ModelSender
        v-for="model in project.senders"
        :key="model.modelCardId"
        :model-card="model"
        :project="project"
        :readonly="isProjectReadOnly"
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
      <template #description>
        Apollo error:
        <code>{{ projectError }}</code>

        <div v-if="!hasAccountMatch" class="my-4">
          This might have happened because you do not have a valid account that can
          access it.
        </div>
      </template>
    </CommonAlert>
    <LayoutDialog v-model:open="askDismissProjectQuestionDialog" fullscreen="none">
      <template #header>Remove Project</template>
      <div class="text-xs mb-4">Do you want to remove the project from this file?</div>
      <div class="flex justify-between center py-2 space-x-3">
        <FormButton size="sm" full-width @click="removeProjectModels">Yes</FormButton>
        <FormButton
          size="sm"
          color="secondary"
          full-width
          @click="
            ;(askDismissProjectQuestionDialog = false), (projectError = undefined)
          "
        >
          Hide error
        </FormButton>
      </div>
    </LayoutDialog>
  </div>
</template>
<script setup lang="ts">
import { useQuery, useSubscription } from '@vue/apollo-composable'
import { ChevronDownIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/20/solid'
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
import type { ApolloError } from '@apollo/client/errors'

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

const hasAccountMatch = computed(() =>
  accountStore.isAccountExistsById(props.project.accountId)
)

const projectAccount = computed(() =>
  accountStore.accountWithFallback(props.project.accountId, props.project.serverUrl)
)

const clientId = projectAccount.value.accountInfo.id

const {
  result: projectDetailsResult,
  onError,
  refetch: refetchProjectDetails
} = useQuery(
  projectDetailsQuery,
  () => ({ projectId: props.project.projectId }),
  () => ({ clientId })
)

const removeProjectModels = async () => {
  await hostAppStore.removeProjectModels(props.project.projectId)
  askDismissProjectQuestionDialog.value = false
}

const projectError = ref<string>()
onError((err: ApolloError) => {
  projectError.value = err.message
})
const projectDetails = computed(() => projectDetailsResult.value?.project)

const isProjectReadOnly = computed(() => {
  if (!projectDetails.value) return true

  if (
    projectDetails.value?.role === null ||
    projectDetails.value?.role === 'stream:reviewer'
  )
    return true
  return false
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
  projectError.value = undefined // clean error, refetch will set it if any
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
