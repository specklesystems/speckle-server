<template>
  <div class="space-y-2 pt-2">
    <div class="flex items-center space-x-2 min-w-0">
      <UserAvatar :user="modelDetails.author" size="sm" class="max-[275px]:hidden" />
      <div class="truncate font-bold text-foreground grow select-none">
        {{ modelDetails.displayName }}
      </div>
      <button
        v-tippy="'Select objects'"
        class="transition hover:text-primary -mt-1"
        @click="app.$baseBinding.highlightModel(model.id)"
      >
        <CursorArrowRaysIcon class="w-4" />
      </button>
      <SendActionsDialog
        @view="viewModel"
        @view-versions="viewModelVersions"
        @remove="removeModel"
      />
    </div>
    <div class="grid grid-cols-2 py-2 max-[275px]:grid-cols-1 gap-2">
      <div>
        <FormButton
          v-if="!model.sending"
          size="sm"
          full-width
          color="card"
          class="flex items-center justify-center"
          :icon-left="CloudArrowUpIcon"
          @click="store.sendModel(model.id)"
        >
          Publish
        </FormButton>
        <FormButton
          v-else
          size="sm"
          full-width
          class="flex items-center justify-center"
          @click="store.sendModelCancel(model.id)"
        >
          Cancel
        </FormButton>
      </div>
      <div
        class="flex h-full items-center space-x-2 text-xs max-[275px]:justify-center rounded-md bg-blue-500/5 pl-2"
      >
        <button
          @click="openFilterDialog = true"
          :icon-left="CubeIcon"
          class="flex min-w-0 transition hover:text-primary py-1"
        >
          <CubeIcon class="h-4 pr-2" />
          <span class="truncate">{{ model.sendFilter?.name }}</span>
        </button>
      </div>

      <!-- TODO: move into filter and settings dialog -->
      <!-- <LayoutDialog v-model:open="openSettingDialog">
        <div class="h5 font-semibold pb-2">Publish Settings</div>
        <hr class="pb-3" />
        <FormJsonForm
          :schema="settingsJsonForms"
          :data="data"
          @change="onParamsFormChange"
        ></FormJsonForm>
      </LayoutDialog> -->
    </div>

    <LayoutDialog v-model:open="openFilterDialog" hide-closerxxx>
      <div class="-mx-6 -my-6 space-y-2">
        <div>
          <div class="font-bold">Change filter</div>
        </div>
        <FilterListSelect :filter="model.sendFilter" @update:filter="updateFilter" />
        <div class="mt-2 flex">
          <FormButton size="sm" text @click=";(openFilterDialog = false), saveFilter()">
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
</template>
<script setup lang="ts">
import {
  CloudArrowUpIcon,
  CubeIcon,
  CursorArrowRaysIcon
} from '@heroicons/vue/24/outline'
import { ISendFilter, ISenderModelCard } from '~~/lib/models/card/send'
import { useGetModelDetails } from '~~/lib/graphql/composables'
import { ProjectModelGroup, useHostAppStore } from '~~/store/hostApp'
import { JsonFormsChangeEvent } from '@jsonforms/vue'
import { JsonSchema } from '@jsonforms/core'
import { CardSetting } from '~/lib/models/card/setting'
import { omit } from 'lodash-es'
import { useAccountStore } from '~/store/accounts'

const store = useHostAppStore()
const accStore = useAccountStore()

const app = useNuxtApp()

const props = defineProps<{
  model: ISenderModelCard
  project: ProjectModelGroup
}>()

const acc = accStore.accounts.find(
  (acc) => acc.accountInfo.id === props.model?.accountId
)
const viewModel = () => {
  app.$baseBinding.openUrl(
    `${acc?.accountInfo.serverInfo.url}/projects/${props.model?.projectId}/models/${props.model.modelId}`
  )
}
const viewModelVersions = () => {
  app.$baseBinding.openUrl(
    `${acc?.accountInfo.serverInfo.url}/projects/${props.model?.projectId}/models/${props.model.modelId}/versions`
  )
}
const removeModel = () => {
  store.removeModel(props.model)
}

let newFilter: ISendFilter
const updateFilter = (filter: ISendFilter) => {
  newFilter = filter
}

const saveFilter = () => {
  store.updateModelFilter(props.model.id, newFilter)
}

const saveFilterAndSend = () => {
  saveFilter()
  store.sendModel(props.model.id)
}

const data = computed(() => {
  const settingValues = {} as Record<string, unknown>
  if (props.model.settings) {
    props.model.settings.forEach((setting) => {
      settingValues[setting.id as string] = setting.value
    })
  }
  return settingValues
})

const settingsJsonForms = computed(() => {
  if (props.model.settings === undefined) return {}
  const obj: JsonSchema = {
    type: 'object',
    properties: {}
  }
  props.model.settings.forEach((setting: CardSetting) => {
    const mappedSetting = omit({ ...setting, $id: setting.id }, ['id', 'value'])
    if (obj && obj.properties) {
      obj.properties[setting.id] = mappedSetting
    }
  })
  return obj
})

const getModelDetails = useGetModelDetails(props.project.accountId)

const modelDetails = await getModelDetails({
  projectId: props.model.projectId,
  modelId: props.model.modelId
})

const openFilterDialog = ref(false)

// const onParamsFormChange = (e: JsonFormsChangeEvent) => {
//   // console.log(JSON.parse(JSON.stringify(e.data)))
//   store.updateModelSettings(props.model.id, e.data as DataType)
// }
</script>
