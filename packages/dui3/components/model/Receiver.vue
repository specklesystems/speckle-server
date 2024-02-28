<template>
  <ModelCardBase :model-card="modelCard" :project="project">
    <div class="grid grid-cols-2 py-2 max-[275px]:grid-cols-1 gap-2">
      <div>
        <FormButton
          size="sm"
          full-width
          color="card"
          class="flex items-center justify-center"
          @click="receiveOrCancel"
        >
          {{ modelCard.progress ? 'Cancel' : 'Load' }}
        </FormButton>
      </div>
      <div
        class="flex h-full items-center space-x-2 text-xs max-[275px]:justify-center rounded-md pl-2 font-bold"
      >
        <FormButton
          v-tippy="
            isExpired
              ? 'Warning: you have loaded an older version. Click to change.'
              : 'Change the loaded version'
          "
          :color="isExpired ? 'warning' : 'default'"
          text
          size="sm"
          full-width
          :icon-left="!isExpired ? ClockIcon : ExclamationCircleIcon"
          @click="openVersionsDialog = true"
        >
          {{ modelCard.selectedVersionId }}
        </FormButton>
        <LayoutDialog v-model:open="openVersionsDialog">
          <div class="-mx-6 -my-6 space-y-2">
            <WizardVersionSelector
              :account-id="modelCard.accountId"
              :project-id="modelCard.projectId"
              :model-id="modelCard.modelId"
              :selected-version-id="modelCard.selectedVersionId"
              @next="handleVersionSelection"
            />
          </div>
        </LayoutDialog>
      </div>
    </div>
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
            receiveResult: { ...modelCard.receiveResult, display: false }
          })
        "
      />
      <!-- {{ props.modelCard.receiveResult.display }} -->
    </template>
  </ModelCardBase>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { ClockIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import { ModelCardNotification } from '~/lib/models/card/notification'
import { ProjectModelGroup, useHostAppStore } from '~/store/hostApp'
import { IReceiverModelCard } from '~/lib/models/card/receiver'
import { versionDetailsQuery } from '~/lib/graphql/mutationsAndQueries'
import { watchOnce } from '@vueuse/core'
import { VersionListItemFragment } from '~/lib/common/generated/gql/graphql'

const app = useNuxtApp()

const props = defineProps<{
  modelCard: IReceiverModelCard
  project: ProjectModelGroup
}>()

const store = useHostAppStore()

const openVersionsDialog = ref(false)

const receiveOrCancel = async () => {
  if (props.modelCard.progress)
    await store.receiveModelCancel(props.modelCard.modelCardId)
  await store.receiveModel(props.modelCard.modelCardId)
}

const isExpired = computed(() => {
  return props.modelCard.latestVersionId !== props.modelCard.selectedVersionId
})

const handleVersionSelection = async (
  selectedVersion: VersionListItemFragment,
  latestVersion: VersionListItemFragment
) => {
  openVersionsDialog.value = false
  await store.patchModel(props.modelCard.modelCardId, {
    selectedVersionId: selectedVersion.id,
    latestVersionId: latestVersion.id, // patch this dude as well, to make sure
    hasSelectedOldVersion: selectedVersion.id === latestVersion.id
  })
  await store.receiveModel(props.modelCard.modelCardId)
}

const expiredNotification = computed(() => {
  if (!props.modelCard.latestVersionId || props.modelCard.hasDismissedUpdateWarning)
    return

  const notification = {} as ModelCardNotification
  notification.dismissible = true
  notification.level = 'warning'
  notification.text = 'Newer version available!'
  notification.cta = {
    name: 'Update',
    action: async () => {
      // Note: here we're updating the model card info, and afterwards we're hitting the receive action
      await store.patchModel(props.modelCard.modelCardId, {
        selectedVersionId: props.modelCard.latestVersionId
      })
      if (props.modelCard.progress)
        await store.receiveModelCancel(props.modelCard.modelCardId)
      await store.receiveModel(props.modelCard.modelCardId)
    }
  }
  return notification
})

const receiveResultNotification = computed(() => {
  if (!props.modelCard.receiveResult || props.modelCard.receiveResult.display !== true)
    return

  const notification = {} as ModelCardNotification
  notification.dismissible = true
  notification.level = 'success'
  notification.text = 'Model loaded!'
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
  return notification
})

const { result: versionDetailsResult } = useQuery(
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

// On initialisation, we check whether there was a never version created while we were offline. If so, flagging this dude as expired.
watchOnce(versionDetailsResult, async (newVal) => {
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
