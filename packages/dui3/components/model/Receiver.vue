<template>
  <ModelCardBase
    :model-card="modelCard"
    :project="project"
    @manual-publish-or-load="receiveLatestVersion"
  >
    <div class="flex max-[275px]:flex-col items-center space-x-2 py-2">
      <div class="shrink-0">
        <FormButton
          v-tippy="
            isExpired
              ? 'Warning: you have loaded an older version. Click to change.'
              : 'Change the loaded version'
          "
          :icon-left="ClockIcon"
          text
          size="sm"
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
    <LayoutDialog
      v-model:open="openVersionsDialog"
      chromium65-compatibility
      title="Change loaded version"
    >
      <WizardVersionSelector
        :account-id="modelCard.accountId"
        :project-id="modelCard.projectId"
        :model-id="modelCard.modelId"
        :selected-version-id="modelCard.selectedVersionId"
        @next="handleVersionSelection"
      />
    </LayoutDialog>
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
            displayReceiveComplete: false,
            report: null
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
import { ModelCardNotification } from '~/lib/models/card/notification'
import { ProjectModelGroup, useHostAppStore } from '~/store/hostApp'
import { IReceiverModelCard } from '~/lib/models/card/receiver'
import { versionDetailsQuery } from '~/lib/graphql/mutationsAndQueries'
import { VersionListItemFragment } from '~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import { useInterval, watchOnce } from '@vueuse/core'

const { trackEvent } = useMixpanel()
const app = useNuxtApp()

const props = defineProps<{
  modelCard: IReceiverModelCard
  project: ProjectModelGroup
}>()

const store = useHostAppStore()

const openVersionsDialog = ref(false)

app.$baseBinding.on('documentChanged', () => {
  openVersionsDialog.value = false
})

const receiveOrCancel = async () => {
  if (props.modelCard.progress) {
    await store.receiveModelCancel(props.modelCard.modelCardId)
  } else {
    await store.receiveModel(props.modelCard.modelCardId)
  }
}

const isExpired = computed(() => {
  return props.modelCard.latestVersionId !== props.modelCard.selectedVersionId
})

const handleVersionSelection = async (
  selectedVersion: VersionListItemFragment,
  latestVersion: VersionListItemFragment
) => {
  openVersionsDialog.value = false
  void trackEvent('DUI3 Action', {
    name: 'Load Card Version Change',
    isLatestVersion: selectedVersion === latestVersion
  })
  await store.patchModel(props.modelCard.modelCardId, {
    selectedVersionId: selectedVersion.id,
    latestVersionId: latestVersion.id, // patch this dude as well, to make sure
    hasSelectedOldVersion: selectedVersion.id === latestVersion.id
  })
  await store.receiveModel(props.modelCard.modelCardId)
}

const receiveLatestVersion = async () => {
  // Note: here we're updating the model card info, and afterwards we're hitting the receive action
  await store.patchModel(props.modelCard.modelCardId, {
    selectedVersionId: props.modelCard.latestVersionId
  })
  if (props.modelCard.progress)
    await store.receiveModelCancel(props.modelCard.modelCardId)
  await store.receiveModel(props.modelCard.modelCardId)
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

const receiveResultNotification = computed(() => {
  if (
    !props.modelCard.bakedObjectIds ||
    props.modelCard.displayReceiveComplete !== true
  )
    return

  const notification = {} as ModelCardNotification
  notification.dismissible = true
  notification.level = 'success'
  notification.text = 'Model loaded!'
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
  notification.text = props.modelCard.error
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
    clientId: props.modelCard.accountId
  })
)

const createdAgoUpdater = useInterval(500)

const createdAgo = computed(() => {
  createdAgoUpdater.value++
  return dayjs(versionDetailsResult.value?.project.model.version.createdAt).from(
    dayjs()
  )
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
