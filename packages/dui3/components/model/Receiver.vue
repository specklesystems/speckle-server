<template>
  <ModelCardBase
    :model-card="modelCard"
    :project="project"
    @manual-publish-or-load="handleMainButtonClick"
  >
    <div class="flex max-[275px]:flex-col items-center space-x-2 pb-2">
      <div class="shrink-0">
        <FormButton
          v-tippy="
            isExpired
              ? 'A new version was pushed ' +
                latestVersionCreatedAt +
                '. Click to load a different version.'
              : 'Load a different version'
          "
          :icon-left="ClockIcon"
          text
          size="xs"
          :color="isExpired ? 'warning' : 'card'"
          class="flex min-w-0 transition hover:text-primary py-1"
          :disabled="!!modelCard.progress"
          @click.stop="openVersionsDialog = true"
        >
          <span class="">{{ createdAgo }}</span>
        </FormButton>
      </div>
      <div
        class="min-w-0 truncate text-foreground-2 -mt-1"
        :title="
          versionDetailsResult?.project.model.version.message || 'No message provided'
        "
      >
        <span class="truncate max-[275px]:truncate-no select-none text-xs">
          {{
            versionDetailsResult?.project.model.version.message || 'No message provided'
          }}
        </span>
      </div>
    </div>
    <CommonDialog
      v-model:open="openVersionsDialog"
      fullscreen="none"
      title="Change loaded version"
    >
      <WizardVersionSelector
        :account-id="modelCard.accountId"
        :project-id="modelCard.projectId"
        :model-id="modelCard.modelId"
        :selected-version-id="modelCard.selectedVersionId"
        @next="handleVersionSelection"
      />
    </CommonDialog>
    <template #states>
      <CommonModelNotification
        v-if="expiredNotification"
        :notification="expiredNotification"
        @dismiss="
          store.patchModel(modelCard.modelCardId, {
            hasDismissedUpdateWarning: true
          })
        "
      />
      <CommonModelNotification
        v-if="errorNotification"
        :notification="errorNotification"
        @dismiss="store.patchModel(modelCard.modelCardId, { error: undefined })"
      />
      <CommonModelNotification
        v-if="receiveResultNotification"
        :notification="receiveResultNotification"
        @dismiss="
          store.patchModel(modelCard.modelCardId, {
            displayReceiveComplete: false
          })
        "
      />
    </template>
  </ModelCardBase>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'

import { useQuery } from '@vue/apollo-composable'
import { ClockIcon } from '@heroicons/vue/24/solid'
import type { ModelCardNotification } from '~/lib/models/card/notification'
import type { ProjectModelGroup } from '~/store/hostApp'
import { useHostAppStore } from '~/store/hostApp'
import type { IReceiverModelCard } from '~/lib/models/card/receiver'
import { versionDetailsQuery } from '~/lib/graphql/mutationsAndQueries'
import type { VersionListItemFragment } from '~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import { useInterval, watchOnce } from '@vueuse/core'
import { useAccountStore } from '~~/store/accounts'

const { trackEvent } = useMixpanel()
const app = useNuxtApp()
const accountStore = useAccountStore()

const props = defineProps<{
  modelCard: IReceiverModelCard
  project: ProjectModelGroup
}>()

const store = useHostAppStore()

const openVersionsDialog = ref(false)

const projectAccount = computed(() =>
  accountStore.accountWithFallback(props.project.accountId, props.project.serverUrl)
)

app.$baseBinding.on('documentChanged', () => {
  openVersionsDialog.value = false
})

const isExpired = computed(() => {
  return props.modelCard.latestVersionId !== props.modelCard.selectedVersionId
})

// Cancels any in progress receive AND load selected version
const handleVersionSelection = async (
  selectedVersion: VersionListItemFragment,
  latestVersion: VersionListItemFragment
) => {
  openVersionsDialog.value = false
  void trackEvent('DUI3 Action', {
    name: 'Load Card Version Change',
    isLatestVersion: selectedVersion === latestVersion
  })
  if (props.modelCard.progress) {
    await store.receiveModelCancel(props.modelCard.modelCardId)
  }
  await store.patchModel(props.modelCard.modelCardId, {
    selectedVersionId: selectedVersion.id,
    selectedVersionSourceApp: selectedVersion.sourceApplication,
    selectedVersionUserId: selectedVersion.authorUser?.id,
    latestVersionId: latestVersion.id, // patch this dude as well, to make sure
    latestVersionSourceApp: latestVersion.sourceApplication,
    latestVersionUserId: latestVersion.authorUser?.id,
    hasSelectedOldVersion: selectedVersion.id === latestVersion.id
  })

  await store.receiveModel(props.modelCard.modelCardId, 'VersionSelector')
}

// Cancels any in progress receive OR receives latest version
const handleMainButtonClick = async () => {
  if (props.modelCard.progress)
    return await store.receiveModelCancel(props.modelCard.modelCardId)
  await receiveCurrentVersion()
}

const receiveCurrentVersion = async () => {
  await store.receiveModel(props.modelCard.modelCardId, 'ModelCardButton')
}

// Cancels any in progress receive AND receives latest version
const receiveLatestVersion = async () => {
  // Note: here we're updating the model card info, and afterwards we're hitting the receive action
  await store.patchModel(props.modelCard.modelCardId, {
    selectedVersionId: props.modelCard.latestVersionId,
    selectedVersionSourceApp: props.modelCard.latestVersionSourceApp,
    selectedVersionUserId: props.modelCard.latestVersionUserId
  })
  if (props.modelCard.progress)
    await store.receiveModelCancel(props.modelCard.modelCardId)
  await store.receiveModel(props.modelCard.modelCardId, 'UpdateNotification')
}

const expiredNotification = computed(() => {
  if (!props.modelCard.latestVersionId || props.modelCard.hasDismissedUpdateWarning)
    return
  if (props.modelCard.latestVersionId === props.modelCard.selectedVersionId) return
  const notification = {} as ModelCardNotification
  notification.dismissible = true
  notification.level = 'warning'
  notification.text = 'Newer version available!'
  notification.cta = {
    name: 'Update',
    action: receiveLatestVersion
  }
  return notification
})

const failRate = computed(() => {
  if (!props.modelCard.report) return 0
  return (
    (props.modelCard.report.filter((r) => r.status === 4).length /
      props.modelCard.report.length) *
    100
  )
})

const receiveResultNotificationText = computed(() => {
  if (failRate.value > 80) {
    return 'Model loaded. Some objects have failed to convert!'
  }
  return 'Model loaded!'
})

const receiveResultNotificationLevel = computed(() => {
  if (failRate.value > 80) {
    return 'warning'
  }
  return 'info'
})

const receiveResultNotification = computed(() => {
  if (
    !props.modelCard.bakedObjectIds ||
    props.modelCard.displayReceiveComplete !== true
  )
    return

  const notification = {} as ModelCardNotification
  notification.dismissible = true
  notification.level = receiveResultNotificationLevel.value
  notification.text = receiveResultNotificationText.value
  notification.report = props.modelCard.report
  notification.cta = {
    name: 'Highlight',
    action: () => {
      app.$baseBinding.highlightModel(props.modelCard.modelCardId)
    }
  }
  return notification
})

const errorNotification = computed(() => {
  if (!props.modelCard.error) return
  const notification = {} as ModelCardNotification
  notification.dismissible = true
  notification.level = 'danger'
  notification.text = props.modelCard.error.errorMessage
  notification.report = props.modelCard.report
  return notification
})

const { result: versionDetailsResult, refetch } = useQuery(
  versionDetailsQuery,
  () => ({
    projectId: props.modelCard.projectId,
    modelId: props.modelCard.modelId,
    versionId: props.modelCard.selectedVersionId
  }),
  () => ({
    clientId: projectAccount.value.accountInfo.id
  })
)

const createdAgoUpdater = useInterval(10_000) // refresh the created ago, and latestversion etc. every 10s

const createdAgo = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  createdAgoUpdater.value
  return dayjs(versionDetailsResult.value?.project.model.version.createdAt).from(
    dayjs()
  )
})

const latestVersionCreatedAt = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  createdAgoUpdater.value
  return dayjs(props.modelCard.latestVersionCreatedAt).from(dayjs())
})

onMounted(() => {
  refetch()
})

// On initialisation, we check whether there was a never version created while we were offline. If so, flagging this dude as expired.
watchOnce(versionDetailsResult, async (newVal) => {
  if (!newVal) return
  let patchObject = {}

  if (
    newVal?.project.model.versions.items &&
    newVal?.project.model.versions.items.length !== 0 &&
    newVal?.project.model.versions.items[0].id !== props.modelCard.selectedVersionId
  ) {
    patchObject = {
      latestVersionId: newVal?.project.model.versions.items[0].id,
      latestVersionCreatedAt: newVal?.project.model.versions.items[0].createdAt,
      latestVersionSourceApp: newVal?.project.model.versions.items[0].sourceApplication,
      latestVersionUserId: newVal?.project.model.versions.items[0].authorUser?.id,
      hasDismissedUpdateWarning: props.modelCard.hasSelectedOldVersion ? true : false
    }
  }

  // Always update the card's project name and model name, if needed. Note, this is not needed for senders (senders do not need to create layers).
  await store.patchModel(props.modelCard.modelCardId, {
    ...patchObject,
    projectName: newVal?.project.name as string,
    modelName: newVal?.project.model.name as string
  })
})
</script>
