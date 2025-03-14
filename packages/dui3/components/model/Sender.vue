<template>
  <ModelCardBase
    ref="cardBase"
    :model-card="modelCard"
    :project="project"
    :readonly="readonly"
    @manual-publish-or-load="sendOrCancel"
  >
    <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events vuejs-accessibility/no-static-element-interactions-->
    <div
      class="flex max-[275px]:flex-col items-center space-x-2 max-[275px]:space-x-0 pb-2 max-[275px]:space-y-2"
      @mouseenter="hover = true"
      @mouseleave="hover = false"
    >
      <div class="flex">
        <FormButton
          v-tippy="'Edit what gets published'"
          :icon-left="Square3Stack3DIcon"
          text
          size="sm"
          color="primary"
          class="flex min-w-0 transition hover:text-primary py-1"
          :disabled="!!modelCard.progress || noWriteAccess"
          @click.stop="openFilterDialog = true"
        >
          <span class="">{{ modelCard.sendFilter?.name }}</span>
        </FormButton>
      </div>
      <div
        :title="modelCard.sendFilter?.summary"
        class="flex items-center h-6 space-x-2 text-xs max-[275px]:justify-center rounded-md pl-2 min-w-0 max-w-full truncate user-select-none"
      >
        <FormButton
          v-if="
            hover &&
            modelCard.sendFilter?.expired &&
            modelCard.sendFilter.name === 'Selection'
          "
          text
          color="primary"
          size="sm"
          class="truncate"
          :disabled="!!modelCard.progress || noWriteAccess"
          @click.stop="openFilterDialog = true"
        >
          Publish current selection
        </FormButton>
        <span v-else class="truncate text-foreground-2 select-none max-w-full">
          {{ modelCard.sendFilter?.summary }}
        </span>
      </div>
    </div>
    <CommonDialog
      v-model:open="openFilterDialog"
      :title="`Change filter`"
      fullscreen="none"
    >
      <FilterListSelect :filter="modelCard.sendFilter" @update:filter="updateFilter" />

      <div class="mt-4 flex justify-end items-center space-x-2">
        <!-- TODO: Ux wise, users might want to just save the selection and publish it later. -->
        <FormButton size="sm" color="outline" @click.stop="saveFilter()">
          Save
        </FormButton>
        <FormButton size="sm" @click.stop="saveFilterAndSend()">
          Save & Publish
        </FormButton>
      </div>
    </CommonDialog>

    <template #states>
      <CommonModelNotification
        v-if="expiredNotification"
        :notification="expiredNotification"
      />
      <CommonModelNotification
        v-if="errorNotification"
        :notification="errorNotification"
        :report="modelCard.report"
        @dismiss="store.patchModel(modelCard.modelCardId, { error: undefined })"
      />
      <CommonModelNotification
        v-if="latestVersionNotification"
        :notification="latestVersionNotification"
        :report="modelCard.report"
        @dismiss="
          store.patchModel(modelCard.modelCardId, {
            latestCreatedVersionId: undefined
          })
        "
      />
    </template>
  </ModelCardBase>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import ModelCardBase from '~/components/model/CardBase.vue'
import { Square3Stack3DIcon } from '@heroicons/vue/20/solid'
import type { ModelCardNotification } from '~/lib/models/card/notification'
import type { ISendFilter, ISenderModelCard } from '~/lib/models/card/send'
import type { ProjectModelGroup } from '~/store/hostApp'
import { useHostAppStore } from '~/store/hostApp'
import { useMixpanel } from '~/lib/core/composables/mixpanel'

const { trackEvent } = useMixpanel()
const app = useNuxtApp()

const cardBase = ref<InstanceType<typeof ModelCardBase>>()
const props = defineProps<{
  modelCard: ISenderModelCard
  project: ProjectModelGroup
  readonly: boolean
}>()

const store = useHostAppStore()
const openFilterDialog = ref(false)
app.$baseBinding.on('documentChanged', () => {
  openFilterDialog.value = false
})

const sendOrCancel = () => {
  if (props.readonly) {
    return
  }
  if (props.modelCard.progress) store.sendModelCancel(props.modelCard.modelCardId)
  else store.sendModel(props.modelCard.modelCardId, 'ModelCardButton')
}

let newFilter: ISendFilter
const updateFilter = (filter: ISendFilter) => {
  newFilter = filter
}

const saveFilter = async () => {
  void trackEvent('DUI3 Action', {
    name: 'Publish Card Filter Change',
    filter: newFilter.typeDiscriminator
  })

  // do not reset idmap while creating a new one because it is managed by host app
  newFilter.idMap = props.modelCard.sendFilter?.idMap

  await store.patchModel(props.modelCard.modelCardId, {
    sendFilter: newFilter,
    expired: true
  })
  openFilterDialog.value = false
}

const hover = ref(false)

const saveFilterAndSend = async () => {
  await saveFilter()
  store.sendModel(props.modelCard.modelCardId, 'Filter')
}

const expiredNotification = computed(() => {
  if (!props.modelCard.expired) return

  const notification = {} as ModelCardNotification
  notification.dismissible = false
  notification.level = props.modelCard.progress ? 'warning' : 'info'
  notification.text = props.modelCard.progress
    ? 'Model was changed while publishing'
    : 'Out of sync with application'

  const ctaType = props.modelCard.progress ? 'Restart' : 'Update'
  notification.cta = {
    name: ctaType,
    action: async () => {
      if (props.modelCard.progress) {
        await store.sendModelCancel(props.modelCard.modelCardId)
      }
      store.sendModel(props.modelCard.modelCardId, ctaType)
    }
  }
  return notification
})

const errorNotification = computed(() => {
  if (!props.modelCard.error) return
  const notification = {} as ModelCardNotification
  notification.dismissible = props.modelCard.error.dismissible
  notification.level = 'danger'
  notification.text = props.modelCard.error.errorMessage
  notification.report = props.modelCard.report
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

const sendResultNotificationText = computed(() => {
  if (failRate.value > 80) {
    return 'Version created. Some objects have failed to convert!'
  }
  return 'Version created!'
})

const sendResultNotificationLevel = computed(() => {
  if (failRate.value > 80) {
    return 'warning'
  }
  return 'info'
})

const latestVersionNotification = computed(() => {
  if (!props.modelCard.latestCreatedVersionId) return
  const notification = {} as ModelCardNotification
  notification.dismissible = true
  notification.level = sendResultNotificationLevel.value
  notification.text = sendResultNotificationText.value
  notification.report = props.modelCard.report
  notification.cta = {
    name: 'View',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    action: () => cardBase.value?.viewModel()
  }
  return notification
})

const noWriteAccess = computed(() => {
  return props.readonly
})
</script>
