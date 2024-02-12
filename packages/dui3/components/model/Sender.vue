<template>
  <ModelCardBase ref="cardBase" :model-card="modelCard" :project="project">
    <div class="grid grid-cols-2 py-2 max-[275px]:grid-cols-1 gap-2">
      <div>
        <FormButton
          v-if="!modelCard.progress"
          size="sm"
          full-width
          color="card"
          class="flex items-center justify-center"
          :icon-left="modelCard.progress ? null : CloudArrowUpIcon"
          @click="sendOrCancel"
        >
          {{ modelCard.progress ? 'Cancel' : 'Publish' }}
        </FormButton>
        <FormButton
          v-else
          size="sm"
          full-width
          class="flex items-center justify-center"
          @click="sendOrCancel"
        >
          Cancel
        </FormButton>
      </div>
      <div
        class="flex h-full items-center space-x-2 text-xs max-[275px]:justify-center rounded-md pl-2 font-bold"
      >
        <button
          v-tippy="'Edit what gets published'"
          :icon-left="CubeIcon"
          class="flex min-w-0 transition hover:text-primary py-1"
          :disabled="!!modelCard.progress"
          @click="openFilterDialog = true"
        >
          <CubeIcon class="h-4 pr-2" />
          <span class="truncate">{{ modelCard.sendFilter?.name }}</span>
        </button>
        <LayoutDialog v-model:open="openFilterDialog">
          <div class="-mx-6 -my-6 space-y-2">
            <div>
              <div class="font-bold">Change filter</div>
            </div>
            <FilterListSelect
              :filter="modelCard.sendFilter"
              @update:filter="updateFilter"
            />
            <div class="mt-2 flex">
              <FormButton
                size="sm"
                text
                @click=";(openFilterDialog = false), saveFilter()"
              >
                Save
              </FormButton>
              <FormButton
                size="sm"
                full-width
                @click=";(openFilterDialog = false), saveFilterAndSend()"
              >
                Save & Publish
              </FormButton>
            </div>
          </div>
        </LayoutDialog>
      </div>
    </div>
    <template #states>
      <CommonModelNotification
        v-if="expiredNotification"
        :notification="expiredNotification"
      />
      <CommonModelNotification
        v-if="errorNotification"
        :notification="errorNotification"
        @dismiss="store.patchModel(modelCard.modelCardId, { error: undefined })"
      />
      <CommonModelNotification
        v-if="latestVersionNotification"
        :notification="latestVersionNotification"
        @dismiss="
          store.patchModel(modelCard.modelCardId, { latestCreatedVersionId: undefined })
        "
      />
    </template>
  </ModelCardBase>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import ModelCardBase from '~/components/model/CardBase.vue'
import { CloudArrowUpIcon, CubeIcon } from '@heroicons/vue/24/outline'
import { ModelCardNotification } from '~/lib/models/card/notification'
import { ISendFilter, ISenderModelCard } from '~/lib/models/card/send'
import { ProjectModelGroup, useHostAppStore } from '~/store/hostApp'

const cardBase = ref<InstanceType<typeof ModelCardBase>>()

const props = defineProps<{
  modelCard: ISenderModelCard
  project: ProjectModelGroup
}>()

const store = useHostAppStore()
const openFilterDialog = ref(false)
const sendOrCancel = () => {
  if (props.modelCard.progress) store.sendModelCancel(props.modelCard.modelCardId)
  else store.sendModel(props.modelCard.modelCardId)
}

let newFilter: ISendFilter
const updateFilter = (filter: ISendFilter) => {
  newFilter = filter
}

const saveFilter = async () => {
  await store.patchModel(props.modelCard.modelCardId, {
    sendFilter: newFilter,
    expired: true
  })
}

const saveFilterAndSend = async () => {
  await saveFilter()
  store.sendModel(props.modelCard.modelCardId)
}

const expiredNotification = computed(() => {
  if (!props.modelCard.expired) return
  const notification = {} as ModelCardNotification
  notification.dismissible = false
  notification.level = props.modelCard.progress ? 'warning' : 'info'
  notification.text = props.modelCard.progress
    ? 'Model was changed while publishing'
    : 'Model is out of sync with application.'
  notification.cta = {
    name: props.modelCard.progress ? 'Restart' : 'Update',
    action: async () => {
      if (props.modelCard.progress) {
        await store.sendModelCancel(props.modelCard.modelCardId)
      }
      store.sendModel(props.modelCard.modelCardId)
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

const latestVersionNotification = computed(() => {
  if (!props.modelCard.latestCreatedVersionId) return
  const notification = {} as ModelCardNotification
  notification.dismissible = true
  notification.level = 'success'
  notification.text = 'Version created!'
  notification.cta = {
    name: 'View',
    action: () => cardBase.value?.viewModel()
  }
  return notification
})
</script>
